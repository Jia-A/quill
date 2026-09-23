import { Prisma, PrismaClient, PostVisibility } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { sanitizeBlogHtml } from "../lib/sanitizeHtml";
import { deleteCloudinaryImage } from "../lib/deleteCloudinaryImage";
import { authMiddleware } from "../middlewares/authMiddleware";
const VIS = Object.values(PostVisibility);

export const blogRouter = new Hono<{
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

blogRouter.post("/", authMiddleware, async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();
  const userId = c.get("userId") as string;

  try {
    const visibility =
      body.visibility ??
      (body.published === true ? "PUBLIC" : body.published === false ? "DRAFT" : undefined);
    if (visibility !== undefined && !VIS.includes(visibility))
      return c.json({ error: { code: "INVALID_VISIBILITY", message: "Invalid visibility" } }, 400);
    const blog = await prisma.post.create({
      data: {
        title: body.title,
        content: await sanitizeBlogHtml(body.content),
        image: body.image,
        authorId: userId,
        visibility: visibility ?? "DRAFT",
        published: (visibility ?? "DRAFT") === "PUBLIC",
        publishedDate: visibility === "PUBLIC" ? new Date() : null,
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

blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  // ?q= filters the list by title or author name.
  const q = c.req.query("q")?.trim();

  try {
    const blogs = await prisma.post.findMany({
      where: {
        visibility: "PUBLIC",
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" as const } },
                { author: { name: { contains: q, mode: "insensitive" as const } } },
              ],
            }
          : {}),
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
      orderBy: {
        publishedDate: "desc",
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

    if (blog.visibility !== "PUBLIC") {
      let requesterId: string | undefined;
      const headers = c.req.header("authorization") || "";
      try {
        const verifiedString = await verify(headers, c.env.JWT_SECRET, "HS256");
        requesterId = verifiedString?.id as string | undefined;
      } catch {
        requesterId = undefined;
      }

      if (requesterId === undefined) {
        return c.json(
          {
            error: {
              code: "AUTH_FAILED",
              message:
                "You're not authorized to access this blog, please login with proper credentials first.",
            },
          },
          403
        );
      }

      if (requesterId === blog.authorId) {
        return c.json({ blog }, 200);
      }

      if (blog.visibility === "SHARED") {
        const viaTeam = await prisma.postTeam.findFirst({
          where: { postId: blog.id, team: { members: { some: { userId: requesterId } } } },
        });
        if (viaTeam) {
          return c.json({ blog }, 200);
        } else {
          return c.json({ error: { code: "NOT_FOUND", message: "Post not found" } }, 404);
        }
      }
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

blogRouter.put("/:postId", authMiddleware, async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();

  try {
    const visibility =
      body.visibility ??
      (body.published === true ? "PUBLIC" : body.published === false ? "DRAFT" : undefined);
    if (visibility !== undefined && !VIS.includes(visibility))
      return c.json({ error: { code: "INVALID_VISIBILITY", message: "Invalid visibility" } }, 400);
    const existing = await prisma.post.findFirst({
      where: { id: c.req.param("postId"), authorId: c.get("userId") as string },
      select: { visibility: true, publishedDate: true },
    });

    const blog = await prisma.post.update({
      where: {
        id: c.req.param("postId"),
        authorId: c.get("userId") as string,
      },
      data: {
        title: body.title,
        content: await sanitizeBlogHtml(body.content),
        image: body.image,
        publishedDate:
          visibility === "PUBLIC" && existing?.visibility !== "PUBLIC"
            ? new Date()
            : (existing?.publishedDate ?? null),
        ...(visibility !== undefined ? { visibility, published: visibility === "PUBLIC" } : {}),
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

blogRouter.delete("/:postId", authMiddleware, async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blog = await prisma.post.delete({
      where: {
        id: c.req.param("postId"),
        authorId: c.get("userId") as string,
      },
    });

    // Best effort: the post is already gone, so a failed cleanup only leaves an
    // orphaned Cloudinary asset and must not fail the request.
    if (blog.image) {
      try {
        const result = await deleteCloudinaryImage({
          prisma,
          userId: c.get("userId") as string,
          url: blog.image,
          env: c.env,
        });
        if (!result.ok)
          console.error("Could not clean up image for deleted post", blog.id, result.message);
      } catch (err) {
        console.error("Could not clean up image for deleted post", blog.id, err);
      }
    }

    return c.json(
      {
        message: "Blog deleted successfully",
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
