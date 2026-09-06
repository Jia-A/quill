export type CloudinaryEnv = {
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
};

export async function sign(params: Record<string, string>, secret: string) {
  const toSign =
    Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&") + secret;
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

type ImageClient = {
  imageUpload: {
    findFirst: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
};

export type DeleteImageResult =
  | { ok: true }
  | { ok: false; code: string; message: string; status: 404 | 500 };

/**
 * Removes an uploaded image from Cloudinary and from the ImageUpload table.
 * Scoping the lookup by userId means another user's image is simply not found.
 */
export async function deleteCloudinaryImage({
  prisma,
  userId,
  url,
  env,
}: {
  prisma: ImageClient;
  userId: string;
  url: string;
  env: CloudinaryEnv;
}): Promise<DeleteImageResult> {
  const record = await prisma.imageUpload.findFirst({
    where: { url, userId },
  });

  if (!record)
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "No image found with the given url!",
      status: 404,
    };

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedParams = {
    public_id: record.publicId,
    timestamp,
  };
  const signature = await sign(signedParams, env.CLOUDINARY_API_SECRET);

  const cloudinaryForm = new FormData();
  for (const [k, v] of Object.entries(signedParams)) cloudinaryForm.append(k, v);
  cloudinaryForm.append("api_key", env.CLOUDINARY_API_KEY);
  cloudinaryForm.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
    {
      method: "POST",
      body: cloudinaryForm,
    }
  );

  const data = (await response.json()) as any;

  // Cloudinary answers 200 with result "not found" for an already-deleted asset;
  // that still means it is gone, so treat it as success.
  if (!response.ok || (data.result !== "ok" && data.result !== "not found")) {
    console.error("ERROR HAPPENED while deleting image from cloudinary", data?.error?.message);
    return {
      ok: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not delete image from cloudinary, please try again later",
      status: 500,
    };
  }

  try {
    await prisma.imageUpload.delete({ where: { id: record.id } });
    return { ok: true };
  } catch (err) {
    console.error("ERROR HAPPENED while deleting image from database.", err);
    return {
      ok: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not delete image from database, please try again later",
      status: 500,
    };
  }
}
