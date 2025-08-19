import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
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
    datasourceUrl: c.env.DATABASE_URL, // we have to access the env vars inside a route only because all the routes might be   deployed independently.
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

    const token = await sign({ id: user.id }, c.env.JWT_SECRET);
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
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  try {
    const userExists = await prisma.user.findFirst({
      where: {
        email: body?.email,
        password: body?.password,
      },
    });
    if (!userExists) {
      return c.json({ error: "User not found" }, 404);
    }
    const token = await sign({ id: userExists.id }, c.env.JWT_SECRET);
    return c.json({
      message: "User signed in successfully",
      token,
    });
  } catch (error) {
    return c.json({ error: error }, 500);
  }
});
