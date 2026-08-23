import { Hono } from "hono";
import { verify } from "hono/jwt";

export const imageRouter = new Hono<{
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

imageRouter.use("/*", async (c, next) => {
  const headers = c.req.header("authorization") || "";
  try {
    const verified = await verify(headers, c.env.JWT_SECRET, "HS256");
    if (!verified.id) return c.json({ error: "Unauthorized" }, 401);
    c.set("userId", verified.id as string);
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

async function sign(params: Record<string, string>, secret: string) {
  const toSign =
    Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&") + secret;
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

imageRouter.post("/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("image") as File;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedParams = {
    folder: "quill",
    timestamp,
    upload_preset: "quill_unsigned",
  };
  const signature = await sign(signedParams, c.env.CLOUDINARY_API_SECRET);

  const cloudinaryForm = new FormData();
  cloudinaryForm.append("file", file);
  for (const [k, v] of Object.entries(signedParams)) cloudinaryForm.append(k, v);
  cloudinaryForm.append("api_key", c.env.CLOUDINARY_API_KEY);
  cloudinaryForm.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${c.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: cloudinaryForm,
    }
  );

  const data = (await response.json()) as any;

  if (!response.ok) {
    return c.json({ error: data.error?.message }, 400);
  }

  return c.json({ url: data.secure_url });
});

imageRouter.post("/upload-url", async (c) => {
  const { url } = await c.req.json<{ url?: string }>();

  let parsed: URL;
  try {
    parsed = new URL(url ?? "");
  } catch {
    return c.json({ error: "Invalid URL" }, 400);
  }

  // Only allow public http(s) images; blocks file://, data:, and SSRF at localhost/LAN.
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return c.json({ error: "Only http(s) URLs are allowed" }, 400);
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host.includes(":") // raw IPv6, incl. ::1
  ) {
    return c.json({ error: "URL not allowed" }, 400);
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedParams = {
    folder: "quill",
    timestamp,
    upload_preset: "quill_unsigned",
  };
  const signature = await sign(signedParams, c.env.CLOUDINARY_API_SECRET);

  const cloudinaryForm = new FormData();
  cloudinaryForm.append("file", parsed.toString());
  for (const [k, v] of Object.entries(signedParams)) cloudinaryForm.append(k, v);
  cloudinaryForm.append("api_key", c.env.CLOUDINARY_API_KEY);
  cloudinaryForm.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${c.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: cloudinaryForm,
    }
  );

  const data = (await response.json()) as any;

  if (!response.ok) {
    return c.json({ error: data.error?.message ?? "Could not fetch that image URL" }, 400);
  }

  return c.json({ url: data.secure_url });
});
