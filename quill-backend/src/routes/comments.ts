import { Hono } from "hono";
import { Prisma, PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/authMiddleware";

const NOTIFICATION_TEXT = {
  COMMENT_RECEIVED: "You just received a comment on your post.",
  REPLY_RECEIVED: "Someone replied to your comment.",
  COMMENT_APPROVED: "Your comment has been approved.",
  COMMENT_REJECTED: "Your comment has been rejected.",
} as const;

export const commentRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    NOTIFICATION_DO: DurableObjectNamespace;
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
    let parent;
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

    let recipientId: string;
    if (parentId) {
      parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.postId !== postId || parent.commentStatus !== "APPROVED") {
        return c.json(
          { error: { code: "INVALID_PARENT", message: "Parent comment not found" } },
          400
        );
      }
      recipientId = parent.authorId;
    } else {
      recipientId = post.authorId;
    }

    const response = await prisma.comment.create({
      data: {
        text,
        postId,
        parentId: parentId || null,
        startOffset: parentId ? null : startOffset,
        endOffset: parentId ? null : endOffset,
        anchorText: parentId ? null : anchorText,
        authorId: userId,
        commentStatus:
          post.authorId === userId || (parentId && parentId !== "") ? "APPROVED" : "PENDING",
      },
    });
    if (recipientId !== userId) {
      try {
        const notification = await prisma.notification.create({
          data: {
            type: parentId ? "REPLY_RECEIVED" : "COMMENT_RECEIVED",
            userId: recipientId,
            postId,
            text: NOTIFICATION_TEXT[parentId ? "REPLY_RECEIVED" : "COMMENT_RECEIVED"],
            commentId: response.id,
            dateAndTime: new Date(),
          },
        });

        const doId = c.env.NOTIFICATION_DO.idFromName(recipientId);
        const stub = c.env.NOTIFICATION_DO.get(doId);
        await stub.fetch("https://internal/notify", {
          method: "POST",
          body: JSON.stringify({ type: notification.type, notificationId: notification.id }),
        });
      } catch (err) {
        console.error("Notification creation failed", err);
      }
    }

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
    // ?status= lets the profile ask for the moderation queue (PENDING, the
    // default) or the comments this author has already rejected.
    const requested = c.req.query("status")?.toUpperCase();
    const commentStatus =
      requested === "APPROVED" || requested === "REJECTED" ? requested : "PENDING";

    const response = await prisma.comment.findMany({
      where: { post: { authorId: userId }, commentStatus },
      include: { post: { select: { title: true } }, author: { select: { name: true, id: true } } },
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
        // Replies need their author too — the thread UI renders the name
        // beside each reply, and without this it is always undefined.
        replies: {
          where: visibility,
          include: { author: { select: { name: true, email: true, id: true } } },
          orderBy: { createdAt: "asc" },
        },
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

commentRouter.get("/", authMiddleware, async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const userId = c.get("userId") as string;

  try {
    const comments = await prisma.comment.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          select: {
            title: true,
            author: {
              select: { name: true },
            },
          },
        },
        // A row may be a reply the user wrote. Include the comment it answers
        // so the profile can show that context instead of a bare line — a
        // reply carries no anchorText of its own.
        parent: {
          select: {
            id: true,
            text: true,
            anchorText: true,
            author: { select: { name: true } },
          },
        },
      },
    });
    return c.json({ comments }, 200);
  } catch (err) {
    console.error("Error fetching user comments", err);
    return c.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Something bad happened, please try again later.",
        },
      },
      500
    );
  }
});

commentRouter.patch("/:id", authMiddleware, async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const userId = c.get("userId") as string;
  const commentId = c.req.param("id");
  const VALID_STATUSES = ["APPROVED", "REJECTED"];

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
      const notificationType = status === "APPROVED" ? "COMMENT_APPROVED" : "COMMENT_REJECTED";
      if (comment.authorId !== userId) {
        try {
          const notification = await prisma.notification.create({
            data: {
              type: notificationType,
              userId: comment.authorId,
              postId: comment.postId,
              text: NOTIFICATION_TEXT[notificationType],

              commentId: response.id,
              dateAndTime: new Date(),
            },
          });

          const doId = c.env.NOTIFICATION_DO.idFromName(comment.authorId);
          const stub = c.env.NOTIFICATION_DO.get(doId);
          await stub.fetch("https://internal/notify", {
            method: "POST",
            body: JSON.stringify({
              type: notification.type,
              notificationId: notification.id,
            }),
          });
        } catch (err) {
          console.error("Notification cannot be created", err);
        }
      }
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
