import { PrismaClient } from "../generated/prisma/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { hashPassword, verifyPassword } from "../lib/password";
import { verifyOAuthToken, isSupportedProvider } from "../lib/verifyOAuth";

function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  return null;
}

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    LINKEDIN_CLIENT_ID: string;
  };
  Variables: {
    userId: string;
  };
}>();

userRouter.post("/signup", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL, // we are keeping accelerateURL separetely in each route because it might be possible that the routes will be deployed separately as well
  }).$extends(withAccelerate());

  const body = await c.req.json();

  const passwordError = validatePassword(body.password);
  if (passwordError) {
    return c.json({ error: passwordError }, 400);
  }

  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: await hashPassword(body.password),
        name: body.name,
      },
    });
    const token = await sign({ id: user.id }, c.env.JWT_SECRET, "HS256");
    setCookie(c, "token", token, { sameSite: "None", secure: true, path: "/" });
    const { password: _pw, ...safeUser } = user;
    return c.json(
      {
        message: "User created successfully",
        user: safeUser,
        token,
      },
      201
    );
  } catch (err: any) {
    if (err?.code === "P2002")
      return c.json(
        {
          error: {
            code: "Email_Taken",
            message: "Please try another email since this one is taken",
          },
        },
        409
      );
    return c.json(
      {
        error: {
          code: "Internal_Server_Error",
          message: "There has been an internal server error, please try again later.",
        },
      },
      500
    );
  }
});

userRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: body?.email,
      },
    });
    if (!user || !user.password) {
      return c.json({ error: "Invalid email or password" }, 401);
    }
    const valid = await verifyPassword(body?.password ?? "", user.password);
    if (!valid) {
      return c.json({ error: "Invalid email or password" }, 401);
    }
    const token = await sign({ id: user.id }, c.env.JWT_SECRET, "HS256");
    setCookie(c, "token", token, { sameSite: "None", secure: false, path: "/" });
    const { password: _pw, ...safeUser } = user;
    return c.json(
      {
        message: "User signed in successfully",
        user: safeUser,
        token,
      },
      200
    );
  } catch (error) {
    console.error("ERROR HAPPENED in /signin", error);
    return c.json({ error: { message: "Internal server error happened" } }, 500);
  }
});

userRouter.post("/oauth-sync", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return c.json({ error: { code: "BAD_REQUEST", message: "Invalid request body" } }, 400);
    }

    const { provider, idToken, accessToken, name, avatar } = body as Record<string, unknown>;

    if (!isSupportedProvider(provider)) {
      return c.json({ error: "Unsupported provider" }, 400);
    }

    // GitHub has no ID token — it is verified by spending its access token.
    const credential = provider === "github" ? accessToken : idToken;

    const email = await verifyOAuthToken(provider, credential, c.env);
    if (!email) {
      return c.json({ error: "Could not verify provider identity" }, 401);
    }
    const safeName = typeof name === "string" ? name : null;
    const safeAvatar = typeof avatar === "string" ? avatar : null;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    const shouldUpdateAvatar = !existingUser || !existingUser.avatarIsCustom;

    // Upsert: create if not exists, otherwise return existing user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        // refresh name/avatar in case they changed on the provider side
        avatar: shouldUpdateAvatar ? (safeAvatar ?? undefined) : undefined,
      },
      create: {
        email,
        name: safeName,
        avatar: safeAvatar,
      },
    });

    const token = await sign({ id: user.id }, c.env.JWT_SECRET, "HS256");

    const { password: _pw, ...safeUser } = user;
    return c.json(
      {
        message: "OAuth user synced",
        user: safeUser,
        token,
      },
      200
    );
  } catch (error) {
    console.error("ERROR HAPPENED in /oauth-sync", error);
    return c.json({ error: "Internal server error, OAuth sync failed" }, 500);
  }
});

userRouter.get("/me", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const headers = c.req.header("authorization") || "";
  let userId;
  try {
    const verified = await verify(headers, c.env.JWT_SECRET, "HS256");
    if (verified?.id) {
      userId = verified.id as string;
    } else {
      return c.json({ error: { code: "INVALID_TOKEN", message: "Invalid auth token" } }, 401);
    }
  } catch (err) {
    console.error("ERROR HAPPENED in /me", err);
    return c.json({ error: { code: "UNAUTHORIZED", message: "Verification failed" } }, 401);
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: { posts: true },
    });
    if (!user) {
      return c.json({ error: { code: "USER_NOT_FOUND", message: "User not found" } }, 404);
    }
    const { password: _pw, ...safeUser } = user;
    return c.json({ user: safeUser }, 200);
  } catch (err) {
    console.error("ERROR HAPPENED in /me", err);
    return c.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error happened" } },
      500
    );
  }
});

userRouter.put("/me", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const headers = c.req.header("authorization") || "";

  let userId;
  try {
    const verified = await verify(headers, c.env.JWT_SECRET, "HS256");
    if (verified?.id) {
      userId = verified.id as string;
    } else {
      return c.json({ error: { code: "INVALID_TOKEN", message: "Invalid auth token" } }, 401);
    }
  } catch (err) {
    console.error("ERROR HAPPENED in /me", err);
    return c.json({ error: { code: "UNAUTHORIZED", message: "Verification failed" } }, 401);
  }

  try {
    const body = await c.req.json();
    let customAvatar =
      body?.avatar !== undefined && body?.avatar !== null ? Boolean(body?.avatar) : undefined;
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: body?.name,
        aboutAuthor: body?.aboutAuthor,
        avatar: body?.avatar !== undefined ? body?.avatar : undefined,
        // we need to be aware of 3 cases -
        // user clearly added a new image, user removed the image, user kept the same image so no change
        avatarIsCustom: customAvatar,
      },
    });
    if (!user) {
      return c.json({ error: { code: "USER_NOT_FOUND", message: "User not found" } }, 404);
    }
    const { password: _pw, ...safeUser } = user;
    return c.json({ user: safeUser }, 200);
  } catch (err) {
    console.error("ERROR HAPPENED in /me", err);
    return c.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error happened" } },
      500
    );
  }
});

// Public author profile — no auth required. Only exposes safe fields and published posts.
userRouter.get("/:id", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const user = await prisma.user.findUnique({
      where: { id: c.req.param("id") },
      select: {
        id: true,
        name: true,
        avatar: true,
        aboutAuthor: true,
        followersCount: true,
        occupation: true,
        location: true,
        posts: {
          where: { published: true, private: false },
          orderBy: { publishedDate: "desc" },
        },
      },
    });
    if (!user) {
      return c.json({ error: { code: "USER_NOT_FOUND", message: "User not found" } }, 404);
    }
    return c.json({ user }, 200);
  } catch (err) {
    console.error("ERROR HAPPENED in /:id", err);
    return c.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error happened" } },
      500
    );
  }
});
