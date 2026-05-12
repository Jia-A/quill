import { PrismaClient } from "@prisma/client/edge";
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
    const token = await sign({ id: user.id }, c.env.JWT_SECRET);
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
    setCookie(c, "token", token, { sameSite : "None", secure : false, path : "/"})
    return c.json({
      message: "User signed in successfully",
      userExists,
      token,
    });
  } catch (error) {
    return c.json({ error: error }, 500);
  }
});

