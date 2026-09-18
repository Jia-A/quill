import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware";

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

notificationRouter.get("/", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const id = c.env.NOTIFICATION_DO.idFromName(userId);
  const stub = c.env.NOTIFICATION_DO.get(id);
  return stub.fetch(c.req.raw);
});
