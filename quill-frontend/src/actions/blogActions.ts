import { API_URL } from "@/utils/constants";
import axios from "axios";

// Keep the original function for backward compatibility if needed
export const getBulkBlogs = async () => {
  try {
    const response = await fetch(`${API_URL}/blog/bulk`, {
      next: { revalidate: 300 }, // Enable ISR with 5-minute revalidation
    });

    if (response.ok) {
      return await response.json();
    }
    console.error("Error fetching blogs:", response.status);
  } catch (err) {
    console.error("Error fetching blogs:", err);
  }
  return { blogs: [] };
};

export const postBlog = async (
  payload: {
    title: string;
    content: string;
    image: string;
    published: boolean;
  },
  token: string
) => {
  try {
    const response = await axios.post(`${API_URL}/blog/`, payload, {
      headers: { authorization: token },
    });
    return response.data;
  } catch (err) {
    throw new Error(err?.response?.data?.error?.message ?? "Failed to publish the blog");
  }
};

export const getBlogById = async (id: string) => {
  try {
    const response = await axios.get(`${API_URL}/blog/single/${id}`);
    return response.data;
  } catch (err) {
    // A missing post is a normal outcome, not an error — callers turn it into a 404.
    if (err?.response?.status === 404) return null;
    throw new Error(err?.response?.data?.error?.message ?? "Failed to load the blog");
  }
};

export const editBlog = async (
  postId: string,
  payload: {
    title?: string;
    content?: string;
    image?: string;
    published: boolean;
    authorId?: string;
  },
  token: string
) => {
  try {
    const response = await axios.put(`${API_URL}/blog/${postId}`, payload, {
      headers: { authorization: token },
    });
    return response.data;
  } catch (err) {
    throw new Error(err?.response?.data?.error?.message ?? "Failed to save your changes");
  }
};
