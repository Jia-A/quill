import { Hono } from "hono";
import { verify } from "hono/jwt";
import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const imageRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

imageRouter.use("/*", async (c, next) => {
  const headers = c.req.header("authorization") || "";
  try {
    const verified = await verify(headers, c.env.JWT_SECRET, "HS256");
    if (!verified.id) return c.json({ error: "Unauthorized" }, 401);
    c.set("userId", verified.id as string);
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

async function sign(params: Record<string, string>, secret: string) {
  const toSign =
    Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&") + secret;
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const MAX_UPLOADS_PER_USER = 30;
const USER_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_UPLOADS_PER_DAY_GLOBAL = 200;

type QuotaClient = {
  imageUpload: { count: (args: any) => Promise<number> };
};

// Returns an error response if either the per-user or the global cap is hit.
async function checkQuota(prisma: QuotaClient, userId: string) {
  const since = new Date(Date.now() - USER_WINDOW_MS);
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const [userCount, globalCount] = await Promise.all([
    prisma.imageUpload.count({ where: { userId, createdAt: { gte: since } } }),
    prisma.imageUpload.count({ where: { createdAt: { gte: startOfToday } } }),
  ]);

  if (globalCount >= MAX_UPLOADS_PER_DAY_GLOBAL) {
    return { error: "Upload capacity reached, try again tomorrow", status: 503 as const };
  }
  if (userCount >= MAX_UPLOADS_PER_USER) {
    return {
      error: `Upload limit reached (${MAX_UPLOADS_PER_USER} images per 30 days)`,
      status: 429 as const,
    };
  }
  return null;
}

imageRouter.post("/upload", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const userId = c.get("userId");
  const formData = await c.req.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }
  if (!file.type.startsWith("image/")) {
    return c.json({ error: "Only image files are allowed" }, 400);
  }
  if (file.size > MAX_FILE_BYTES) {
    return c.json({ error: "Image must be under 5MB" }, 413);
  }

  const quotaError = await checkQuota(prisma, userId);
  if (quotaError) {
    return c.json({ error: quotaError.error }, quotaError.status);
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedParams = {
    folder: "quill",
    timestamp,
    upload_preset: "quill_unsigned",
  };
  const signature = await sign(signedParams, c.env.CLOUDINARY_API_SECRET);

  const cloudinaryForm = new FormData();
  cloudinaryForm.append("file", file);
  for (const [k, v] of Object.entries(signedParams)) cloudinaryForm.append(k, v);
  cloudinaryForm.append("api_key", c.env.CLOUDINARY_API_KEY);
  cloudinaryForm.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${c.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: cloudinaryForm,
    }
  );

  const data = (await response.json()) as any;

  if (!response.ok) {
    return c.json({ error: data.error?.message }, 400);
  }

  await prisma.imageUpload.create({
    data: {
      userId,
      publicId: data.public_id,
      url: data.secure_url,
      bytes: data.bytes ?? 0,
    },
  });

  return c.json({ url: data.secure_url });
});

imageRouter.post("/upload-url", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const userId = c.get("userId");
  const { url } = await c.req.json<{ url?: string }>();

  let parsed: URL;
  try {
    parsed = new URL(url ?? "");
  } catch {
    return c.json({ error: "Invalid URL" }, 400);
  }

  // Only allow public http(s) images; blocks file://, data:, and SSRF at localhost/LAN.
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return c.json({ error: "Only http(s) URLs are allowed" }, 400);
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host.includes(":") // raw IPv6, incl. ::1
  ) {
    return c.json({ error: "URL not allowed" }, 400);
  }

  const quotaError = await checkQuota(prisma, userId);
  if (quotaError) {
    return c.json({ error: quotaError.error }, quotaError.status);
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedParams = {
    folder: "quill",
    timestamp,
    upload_preset: "quill_unsigned",
  };
  const signature = await sign(signedParams, c.env.CLOUDINARY_API_SECRET);

  const cloudinaryForm = new FormData();
  cloudinaryForm.append("file", parsed.toString());
  for (const [k, v] of Object.entries(signedParams)) cloudinaryForm.append(k, v);
  cloudinaryForm.append("api_key", c.env.CLOUDINARY_API_KEY);
  cloudinaryForm.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${c.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: cloudinaryForm,
    }
  );

  const data = (await response.json()) as any;

  if (!response.ok) {
    return c.json({ error: data.error?.message ?? "Could not fetch that image URL" }, 400);
  }

  await prisma.imageUpload.create({
    data: {
      userId,
      publicId: data.public_id,
      url: data.secure_url,
      bytes: data.bytes ?? 0,
    },
  });

  return c.json({ url: data.secure_url });
});
