import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign, verify } from "hono/jwt";

export const linkedinRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    LINKEDIN_CLIENT_ID: string;
    LINKEDIN_CLIENT_SECRET: string;
    FRONTEND_URL?: string;
    BACKEND_URL?: string;
  };
  Variables: {
    userId: string;
  };
}>();

function getPrisma(url: string) {
  return new PrismaClient({ accelerateUrl: url }).$extends(withAccelerate());
}

function getRedirectUri(c: any) {
  const backend = c.env.BACKEND_URL ?? "http://localhost:8787";
  return `${backend.replace(/\/$/, "")}/api/v1/linkedin/callback`;
}

// Kick off OAuth: requires the user's app JWT in ?token=... since we can't set headers on a redirect.
linkedinRouter.get("/connect", async (c) => {
  const token = c.req.query("token");
  if (!token) return c.json({ error: "Missing token" }, 401);

  let userId: string;
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, "HS256");
    userId = decoded.id as string;
    if (!userId) throw new Error();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }

  // Signed state so we can trust userId on callback without a session
  const state = await sign({ userId, t: Date.now() }, c.env.JWT_SECRET, "HS256");
  const redirectUri = getRedirectUri(c);

  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", c.env.LINKEDIN_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "openid profile email w_member_social");
  url.searchParams.set("state", state);

  return c.redirect(url.toString());
});

linkedinRouter.get("/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const errorParam = c.req.query("error");
  const frontend = (c.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");

  if (errorParam) {
    return c.redirect(`${frontend}/?linkedin=denied`);
  }
  if (!code || !state) {
    return c.redirect(`${frontend}/?linkedin=error`);
  }

  let userId: string;
  try {
    const decoded = await verify(state, c.env.JWT_SECRET, "HS256");
    userId = decoded.userId as string;
    if (!userId) throw new Error();
  } catch {
    return c.redirect(`${frontend}/?linkedin=invalid_state`);
  }

  const redirectUri = getRedirectUri(c);

  // Exchange code for access token
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: c.env.LINKEDIN_CLIENT_ID,
      client_secret: c.env.LINKEDIN_CLIENT_SECRET,
    }).toString(),
  });
  if (!tokenRes.ok) {
    console.error("LinkedIn token exchange failed", await tokenRes.text());
    return c.redirect(`${frontend}/?linkedin=token_error`);
  }
  const tokenData: any = await tokenRes.json();
  const accessToken: string = tokenData.access_token;
  const expiresIn: number = tokenData.expires_in ?? 60 * 24 * 60 * 60;

  // Fetch user URN via OIDC userinfo
  const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) {
    console.error("LinkedIn userinfo failed", await userRes.text());
    return c.redirect(`${frontend}/?linkedin=userinfo_error`);
  }
  const userInfo: any = await userRes.json();
  const linkedinUrn = `urn:li:person:${userInfo.sub}`;

  const prisma = getPrisma(c.env.DATABASE_URL);
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  await prisma.linkedInAccount.upsert({
    where: { userId },
    create: { userId, accessToken, expiresAt, linkedinUrn },
    update: { accessToken, expiresAt, linkedinUrn },
  });

  return c.redirect(`${frontend}/?linkedin=connected`);
});

// Status check, used by the panel to decide which button to show
linkedinRouter.get("/status", async (c) => {
  const headers = c.req.header("authorization") || "";
  let userId: string;
  try {
    const decoded = await verify(headers, c.env.JWT_SECRET, "HS256");
    userId = decoded.id as string;
    if (!userId) throw new Error();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const prisma = getPrisma(c.env.DATABASE_URL);
  const account = await prisma.linkedInAccount.findUnique({ where: { userId } });
  const connected = !!account && account.expiresAt.getTime() > Date.now();
  return c.json({ connected });
});
