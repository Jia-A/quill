import { PrismaClient } from "../generated/prisma/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { hashPassword, verifyPassword } from "../lib/password";

// Server-side mirror of the frontend password policy. The client schema can be
// bypassed by calling this endpoint directly, so the rule is enforced here too.
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
    return c.json({
      message: "User created successfully",
      user: safeUser,
      token,
    });
  } catch (err: any) {
    return c.json({ error: err?.message });
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
    return c.json({
      message: "User signed in successfully",
      user: safeUser,
      token,
    });
  } catch (error) {
    return c.json({ error: error }, 500);
  }
});

userRouter.post("/oauth-sync", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const { email, name, avatar } = body;

  if (!email) {
    return c.json({ error: "Email is required" }, 400);
  }

  try {
    // Upsert: create if not exists, otherwise return existing user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        // refresh name/avatar in case they changed on the provider side
        name: name ?? undefined,
        avatar: avatar ?? undefined,
      },
      create: {
        email,
        name: name ?? null,
        avatar: avatar ?? null,
        // no password — OAuth users don't have one
      },
    });

    const token = await sign({ id: user.id }, c.env.JWT_SECRET, "HS256");

    const { password: _pw, ...safeUser } = user;
    return c.json({
      message: "OAuth user synced",
      user: safeUser,
      token,
    });
  } catch (error: any) {
    return c.json({ error: error?.message ?? "Sync failed" }, 500);
  }
});
