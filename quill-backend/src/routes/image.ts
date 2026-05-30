import { Hono } from "hono";

export const imageRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    CLOUDINARY_CLOUD_NAME: string;
  };
  Variables: {
    userId: string;
  };
}>();

imageRouter.post("/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("image") as File;
  const cloudinaryForm = new FormData();
  cloudinaryForm.append("file", file);
  cloudinaryForm.append("upload_preset", "quill_unsigned");
  cloudinaryForm.append("folder", "quill");

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
