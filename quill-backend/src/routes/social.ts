import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { generateSocialDraft, PLATFORM_CAPS, Platform } from "../lib/generateSocial";
import { decryptSecret } from "../lib/crypto";

export const socialRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    AI: Ai;
    TOKEN_ENC_KEY: string;
    FRONTEND_URL?: string;
  };
  Variables: {
    userId: string;
  };
}>();

socialRouter.use("/*", async (c, next) => {
  const headers = c.req.header("authorization") || "";
  try {
    const verified = await verify(headers, c.env.JWT_SECRET, "HS256");
    if (verified?.id) {
      c.set("userId", verified.id as string);
      await next();
      return;
    }
  } catch {}
  return c.json({ error: "Unauthorized" }, 401);
});

function getPrisma(url: string) {
  return new PrismaClient({ accelerateUrl: url }).$extends(withAccelerate());
}

function isValidPlatform(p: unknown): p is Platform {
  return p === "linkedin";
}

async function assertOwnership(
  prisma: ReturnType<typeof getPrisma>,
  postId: string,
  userId: string
) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: { select: { name: true } } },
  });
  if (!post) return { error: "Post not found" as const, status: 404 as const };
  if (post.authorId !== userId) return { error: "Forbidden" as const, status: 403 as const };
  return { post };
}

socialRouter.get("/:postId", async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const postId = c.req.param("postId");
  const userId = c.get("userId");

  const check = await assertOwnership(prisma, postId, userId);
  if ("error" in check) return c.json({ error: check.error }, check.status);

  const drafts = await prisma.socialDraft.findMany({ where: { postId } });
  const linkedin = drafts.find((d) => d.platform === "linkedin")?.content ?? null;
  return c.json({ linkedin });
});

socialRouter.post("/:postId/generate", async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const postId = c.req.param("postId");
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const platform = body?.platform;

  if (!isValidPlatform(platform)) {
    return c.json({ error: "Invalid platform" }, 400);
  }

  const check = await assertOwnership(prisma, postId, userId);
  if ("error" in check) return c.json({ error: check.error }, check.status);
  if (!check.post.published) return c.json({ error: "Post must be published" }, 400);

  const origin = c.env.FRONTEND_URL ?? "http://localhost:3000";
  const postUrl = `${origin.replace(/\/$/, "")}/blog/${postId}`;

  const content = await generateSocialDraft(
    c.env.AI,
    {
      title: check.post.title,
      content: check.post.content ?? "",
      summary: check.post.summary,
      authorName: check.post.author?.name ?? null,
      postUrl,
    },
    platform
  );

  if (!content) return c.json({ error: "Generation failed" }, 502);

  const saved = await prisma.socialDraft.upsert({
    where: { postId_platform: { postId, platform } },
    create: { postId, platform, content },
    update: { content },
  });

  return c.json({ platform, content: saved.content });
});

socialRouter.put("/:postId", async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const postId = c.req.param("postId");
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const { platform, content } = body ?? {};

  if (!isValidPlatform(platform)) return c.json({ error: "Invalid platform" }, 400);
  if (typeof content !== "string") return c.json({ error: "Content required" }, 400);
  if (content.length > PLATFORM_CAPS[platform]) {
    return c.json({ error: `Content exceeds ${PLATFORM_CAPS[platform]} characters` }, 400);
  }

  const check = await assertOwnership(prisma, postId, userId);
  if ("error" in check) return c.json({ error: check.error }, check.status);

  const saved = await prisma.socialDraft.upsert({
    where: { postId_platform: { postId, platform } },
    create: { postId, platform, content },
    update: { content },
  });

  return c.json({ platform, content: saved.content });
});

socialRouter.post("/:postId/publish", async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const postId = c.req.param("postId");
  const userId = c.get("userId");

  const check = await assertOwnership(prisma, postId, userId);
  if ("error" in check) return c.json({ error: check.error }, check.status);

  const draft = await prisma.socialDraft.findUnique({
    where: { postId_platform: { postId, platform: "linkedin" } },
  });
  if (!draft?.content) return c.json({ error: "No draft to publish" }, 400);

  const account = await prisma.linkedInAccount.findUnique({ where: { userId } });
  if (!account || account.expiresAt.getTime() <= Date.now()) {
    return c.json({ error: "linkedin_not_connected" }, 412);
  }

  let accessToken: string;
  try {
    accessToken = await decryptSecret(account.accessToken, c.env.TOKEN_ENC_KEY);
  } catch {
    // Token can't be decrypted (key rotated, corrupt, or legacy plaintext row).
    // Treat as disconnected so the user re-authorizes rather than 500-ing.
    return c.json({ error: "linkedin_not_connected" }, 412);
  }

  const origin = (c.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const postUrl = `${origin}/blog/${postId}`;

  const body = {
    author: account.linkedinUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: draft.content },
        shareMediaCategory: "ARTICLE",
        media: [
          {
            status: "READY",
            originalUrl: postUrl,
            title: { text: check.post.title.slice(0, 200) },
            description: {
              text: (check.post.summary ?? "").slice(0, 256) || check.post.title.slice(0, 200),
            },
          },
        ],
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("LinkedIn publish failed", res.status, errText);
    if (res.status === 401) return c.json({ error: "linkedin_not_connected" }, 412);
    return c.json({ error: "publish_failed", detail: errText }, 502);
  }

  const data: any = await res.json().catch(() => ({}));
  const shareUrn: string | undefined = data?.id;
  const permalink = shareUrn ? `https://www.linkedin.com/feed/update/${shareUrn}/` : null;

  return c.json({ ok: true, permalink, shareUrn });
});

socialRouter.delete("/:postId/:platform", async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const postId = c.req.param("postId");
  const platform = c.req.param("platform");
  const userId = c.get("userId");

  if (!isValidPlatform(platform)) return c.json({ error: "Invalid platform" }, 400);

  const check = await assertOwnership(prisma, postId, userId);
  if ("error" in check) return c.json({ error: check.error }, check.status);

  await prisma.socialDraft.deleteMany({ where: { postId, platform } });
  return c.json({ ok: true });
});
