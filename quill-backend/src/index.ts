import { Hono } from "hono";
import { userRouter } from "./routes/user";
import { blogRouter } from "./routes/blogs";
import { socialRouter } from "./routes/social";
import { linkedinRouter } from "./routes/linkedin";
import { cors } from "hono/cors";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    AI: Ai;
    FRONTEND_URL?: string;
    BACKEND_URL?: string;
    LINKEDIN_CLIENT_ID: string;
    LINKEDIN_CLIENT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

app.use(
  "/*",
  cors({
    credentials: true,
    origin: ["http://localhost:3000", "https://lets-quill.vercel.app/"],
  })
);
app.route("/api/v1/user/", userRouter);
app.route("/api/v1/blog/", blogRouter);
app.route("/api/v1/linkedin/", linkedinRouter);
app.route("/api/v1/social/", socialRouter);

export default app;
