import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  const headers = c.req.header("authorization") || "";
  const verifiedString = await verify(headers, c.env.JWT_SECRET);
  if (verifiedString.id) {
    c.set("userId", verifiedString?.id as string);
    await next();
  } else {
    return c.json({ error: "Unauthorized" }, 401);
  }
});

blogRouter.post("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();
  const userId = c.get("userId") as string;

  try {
    const blog = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: userId,
      },
    });

    return c.json({
      message: "Blog created successfully",
      blog,
    });
  } catch (error) {
    return c.json({ error: error }, 500);
  }
});

blogRouter.get("/single/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blog = await prisma.post.findFirst({
      where: {
        id: c.req.param("id"),
      },
    });
    return c.json({
      blog,
    });
  } catch (error) {
    return c.json({ error: error }, 500);
  }
});

blogRouter.put("/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();

  try {
    const blog = await prisma.post.update({
      where: {
        id: c.req.param("id"),
      },
      data: {
        title: body.title,
        content: body.content,
      },
    });
    return c.json({
        message : "Blog updated successfully",
      blog,
    });
  } catch (error) {
    return c.json({ error: error }, 500);
  }
});

blogRouter.get("/bulk", async (c) => {
 const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blogs = await prisma.post.findMany({})
    return c.json({
        blogs,
    });
});
