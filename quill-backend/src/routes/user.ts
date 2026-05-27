import { PrismaClient } from "../generated/prisma/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";

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
  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
        name: body.name,
      },
    });
    const token = await sign({ id: user.id }, c.env.JWT_SECRET, "HS256");
    setCookie(c, "token", token, { sameSite : "None", secure : true, path : "/"})
    return c.json({
      message: "User created successfully",
      user,
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
        password: body?.password,
      },
    });
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    const token = await sign({ id: user.id }, c.env.JWT_SECRET, "HS256");
    setCookie(c, "token", token, { sameSite : "None", secure : false, path : "/"})
    return c.json({
      message: "User signed in successfully",
      user,
      token,
    });
  } catch (error) {
    return c.json({ error: error }, 500);
  }
});

userRouter.post("/oauth-sync", async (c) =>{
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

    return c.json({
      message: "OAuth user synced",
      user,
      token,
    });
  } catch (error: any) {
    return c.json({ error: error?.message ?? "Sync failed" }, 500);
  }
});