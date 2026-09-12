import { API_URL } from "@/utils/constants";

export const uploadImageToCloudinary = async (token: string, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_URL}/image/upload`, {
    method: "POST",
    body: formData,
    headers: { authorization: token },
  });

  if (!response.ok) throw new Error("Upload failed");
  const data = await response.json();
  return data.url;
};

export const deleteImageFromCloudinary = async (token: string | undefined, url: string) => {
  const response = await fetch(`${API_URL}/image/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", authorization: token },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Image delete failed");
  }
};

export const isImageFile = (file: File) => file.type.startsWith("image/");

export const resolvePendingDeletes = (pendingDeletes: string[], finalUrl: string) =>
  pendingDeletes.filter((url) => url !== finalUrl);

export const isCloudinaryUrl = (url: string) => url.includes("res.cloudinary.com");
