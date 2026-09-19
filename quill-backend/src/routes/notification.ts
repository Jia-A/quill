import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware";
import { Prisma, PrismaClient } from "../generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";

export const notificationRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    NOTIFICATION_DO: DurableObjectNamespace;
  };
  Variables: {
    userId: string;
  };
}>();

notificationRouter.post("/ticket", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const id = c.env.NOTIFICATION_DO.idFromName(userId);
  const stub = c.env.NOTIFICATION_DO.get(id);
  const res = await stub.fetch("https://internal/generate-ticket", { method: "POST" });
  return c.json(await res.json());
});

notificationRouter.get("/connect", async (c) => {
  // no authMiddleware here — the ticket itself IS the auth
  const userId = c.req.query("userId");
  const ticket = c.req.query("ticket");
  const id = c.env.NOTIFICATION_DO.idFromName(userId);
  const stub = c.env.NOTIFICATION_DO.get(id);
  const url = new URL(c.req.url);
  url.pathname = "/connect";
  url.searchParams.set("ticket", ticket);
  return stub.fetch(url.toString(), c.req.raw);
});

notificationRouter.get("/", authMiddleware, async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const userId = c.get("userId") as string | undefined;
  const unreadOnly = c.req.query("unreadOnly") === "true";
  const take = Number(c.req.query("take")) || 20;
  const cursor = c.req.query("cursor");
  try {
    const [notificationList, count] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, ...(unreadOnly ? { readStatus: false } : {}) },
        orderBy: { dateAndTime: "desc" },
        take: take,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      }),
      prisma.notification.count({
        where: { userId, readStatus: false },
      }),
    ]);

    return c.json({ notificationList, count }, 200);
  } catch (err) {
    console.error("Error fetching comments", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  }
});

notificationRouter.patch("/:id", authMiddleware, async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const userId = c.get("userId") as string | undefined;
  const notificationId = c.req.param("id");
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      return c.json({ error: { code: "NOT_FOUND", message: "No such notification exists." } }, 404);
    }

    const response = await prisma.notification.update({
      where: { id: notification?.id },
      data: {
        readStatus: true,
      },
    });
    return c.json(
      {
        response,
      },
      200
    );
  } catch (err) {
    console.error("Error fetching comments", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  }
});
