import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

type AuthEnv = {
  Bindings: {
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const headers = c.req.header("authorization") || "";
  try {
    const verified = await verify(headers, c.env.JWT_SECRET, "HS256");
    if (verified?.id) {
      c.set("userId", verified.id as string);
      await next();
      return;
    }
  } catch (err) {
    console.error("ERROR HAPPENED in auth middleware", err);
    if (err instanceof Error && err?.name === "JwtTokenExpired")
      return c.json(
        { error: { code: "TOKEN_EXPIRED", message: "Authentication token has expired" } },
        401
      );
    if (err instanceof Error && err?.name === "JwtTokenInvalid")
      return c.json({ error: { code: "INVALID_TOKEN", message: "Invalid auth token" } }, 401);
    if (err instanceof Error && err?.name === "JwtTokenSignatureMismatched")
      return c.json(
        { error: { code: "INVALID_TOKEN", message: "Invalid auth token signature" } },
        401
      );
  }

  return c.json(
    { error: { code: "INVALID_TOKEN", message: "You're unauthorized,  please try again later." } },
    401
  );
});

export const optionalAuthMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const token = c.req.header("authorization") || "";
  if (!token) {
    await next();
    return;
  }

  try {
    const verified = await verify(token, c.env.JWT_SECRET, "HS256");
    if (verified?.id) {
      c.set("userId", verified.id as string);
    }
  } catch (err) {
    console.error("[optionalAuth] token verification failed:", err);
  }

  await next();
});
