import { Hono } from "hono";
import { userRouter } from "./routes/user";
import { blogRouter } from "./routes/blogs";
import { socialRouter } from "./routes/social";
import { linkedinRouter } from "./routes/linkedin";
import { cors } from "hono/cors";
import { imageRouter } from "./routes/image";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    AI: Ai;
    FRONTEND_URL?: string;
    BACKEND_URL?: string;
    LINKEDIN_CLIENT_ID: string;
    LINKEDIN_CLIENT_SECRET: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    GOOGLE_CLIENT_ID: string;
  };
  Variables: {
    userId: string;
  };
}>();

app.use(
  "/*",
  cors({
    origin: ["http://localhost:3000", "https://lets-quill.vercel.app"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.notFound((c) => {
  return c.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404);
});

app.onError((err, c) => {
  console.error("ERROR HAPPENED : ", err);
  return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
});
app.route("/api/v1/user/", userRouter);
app.route("/api/v1/blog/", blogRouter);
app.route("/api/v1/linkedin/", linkedinRouter);
app.route("/api/v1/social/", socialRouter);
app.route("/api/v1/image/", imageRouter);

export default app;
