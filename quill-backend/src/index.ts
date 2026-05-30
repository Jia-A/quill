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
app.route("/api/v1/user/", userRouter);
app.route("/api/v1/blog/", blogRouter);
app.route("/api/v1/linkedin/", linkedinRouter);
app.route("/api/v1/social/", socialRouter);
app.route("/api/v1/image/", imageRouter);

export default app;
