import { Prisma, PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { sanitizeBlogHtml } from "../lib/sanitizeHtml";

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
  if (c.req.path === "/api/v1/blog/bulk" || c.req.path.startsWith("/api/v1/blog/single")) {
    await next();
    return;
  }
  const headers = c.req.header("authorization") || "";
  try {
    const verifiedString = await verify(headers, c.env.JWT_SECRET, "HS256");
    if (verifiedString.id) {
      c.set("userId", verifiedString?.id as string);
      await next();
    } else {
      return c.json(
        {
          error: { code: "TOKEN_ID_MISSING", message: "ID not found in the authentication token" },
        },
        401
      );
    }
  } catch (err) {
    console.error("Error happened while token verification in blog router", err);
    return c.json(
      { error: { code: "TOKEN_INVALID", message: "Authentication token is invalid." } },
      401
    );
  }
});

blogRouter.post("/", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();
  const userId = c.get("userId") as string;

  try {
    const blog = await prisma.post.create({
      data: {
        title: body.title,
        content: await sanitizeBlogHtml(body.content),
        image: body.image,
        published: body.published,
        authorId: userId,
        publishedDate: body.published ? new Date() : null,
      },
    });

    return c.json(
      {
        message: "Blog created successfully",
        blog,
      },
      201
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return c.json(
        {
          error: {
            code: "INVALID_AUTHOR",
            message: "Blog creation failed. The author is unknown. Please login again or signup",
          },
        },
        400
      );
    } else {
      console.error("ERROR HAPPENED in blog creation /blog:", error);
      return c.json(
        {
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Blog creation failed due to internal server error",
          },
        },
        500
      );
    }
  }
});

blogRouter.get("/single/:id", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blog = await prisma.post.findFirst({
      where: {
        id: c.req.param("id"),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
    if (!blog) {
      return c.json({ error: { code: "NOT_FOUND", message: "Post not found" } }, 404);
    }
    return c.json({ blog }, 200);
  } catch (error) {
    return c.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong on the server side.",
        },
      },
      500
    );
  }
});

blogRouter.put("/:postId", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();

  try {
    const blog = await prisma.post.update({
      where: {
        id: c.req.param("postId"),
        authorId: c.get("userId") as string,
      },
      data: {
        title: body.title,
        content: await sanitizeBlogHtml(body.content),
        image: body.image,
      },
    });
    return c.json(
      {
        message: "Blog updated successfully",
        blog,
        id: c.req.param("postId"),
      },
      200
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      return c.json(
        { error: { code: "NOT_FOUND", message: "Post not found, invalid post id" } },
        404
      );
    return c.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong on the server side.",
        },
      },
      500
    );
  }
});

blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blogs = await prisma.post.findMany({
      where: {
        published: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        image: true,
        publishedDate: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return c.json(
      {
        blogs,
      },
      200
    );
  } catch (err) {
    console.error("ERROR HAPPENED in /bulk:", err);
    return c.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong on the server side, please try again later",
        },
      },
      500
    );
  }
});
