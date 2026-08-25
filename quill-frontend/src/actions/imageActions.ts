import { API_URL } from "@/utils/constants";

export const deleteImageFromCloudinary = async (token: string, url: string) => {
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
