import { Hono } from "hono";
import { Prisma, PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/authMiddleware";

export const commentRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

commentRouter.post("/", authMiddleware, async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const userId = c.get("userId");
  try {
    const { text, postId, parentId, startOffset, endOffset, anchorText } = await c.req
      .json()
      .catch(() => ({}));
    if (!text || !postId) {
      return c.json(
        { error: { code: "MISSING_FIELDS", message: "Content and postId are required" } },
        400
      );
    }
    if (!parentId) {
      if (startOffset === undefined || endOffset === undefined || !anchorText) {
        return c.json(
          { error: { code: "MISSING_ANCHOR", message: "Top-level comments require anchor data" } },
          400
        );
      }
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return c.json({ error: { code: "POST_NOT_FOUND", message: "Post not found" } }, 404);
    }

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.postId !== postId || parent.commentStatus !== "APPROVED") {
        return c.json(
          { error: { code: "INVALID_PARENT", message: "Parent comment not found" } },
          400
        );
      }
    }

    const response = await prisma.comment.create({
      data: {
        text,
        postId,
        parentId,
        startOffset: parentId ? null : startOffset,
        endOffset: parentId ? null : endOffset,
        anchorText: parentId ? null : anchorText,
        authorId: userId,
      },
    });
    return c.json({ message: "Comment created successfully", comment: response }, 201);
  } catch (err) {
    console.error("Error creating comment:", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  }
});

commentRouter.get("/pending", authMiddleware, async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const userId = c.get("userId") as string;

  try {
    const response = await prisma.comment.findMany({
      where: { post: { authorId: userId }, commentStatus: "PENDING" },
      take: 50,
      orderBy: { createdAt: "asc" },
    });

    return c.json({ comments: response });
  } catch (err) {
    console.error("Error fetching comments", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  }
});

commentRouter.get("/:postId", optionalAuthMiddleware, async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const postId = c.req.param("postId");
  const userId = c.get("userId") as string | undefined;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return c.json({ error: { code: "POST_NOT_FOUND", message: "Post not found" } }, 404);
    }
    const isAuthor = post.authorId === userId;

    const visibility: Prisma.CommentWhereInput = isAuthor
      ? {}
      : userId
        ? { OR: [{ commentStatus: "APPROVED" }, { authorId: userId }] }
        : { commentStatus: "APPROVED" };

    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null, ...visibility },
      include: {
        replies: { where: visibility },
        author: { select: { name: true, email: true, id: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return c.json({ comments }, 200);
  } catch (err) {
    console.error("Error fetching comments", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  }
});

commentRouter.patch("/:id", authMiddleware, async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const userId = c.get("userId") as string;
  const commentId = c.req.param("id");
  const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

  try {
    const { status } = await c.req.json();
    if (!VALID_STATUSES.includes(status)) {
      return c.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: "Invalid inputs sent for the comment status",
          },
        },
        400
      );
    }
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });
    if (!comment) {
      return c.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "The comment you're looking for doesn't exist",
          },
        },
        404
      );
    }
    if (comment.post.authorId === userId) {
      const response = await prisma.comment.update({
        where: { id: commentId },
        data: {
          commentStatus: status,
        },
      });

      return c.json({ response }, 200);
    } else {
      return c.json(
        {
          error: {
            code: "NOT_AUTHORIZED",
            message: "You're not authorized to perform this task.",
          },
        },
        403
      );
    }
  } catch (err) {
    console.error("Error fetching comments", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  }
});
