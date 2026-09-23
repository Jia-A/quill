import { API_URL } from "@/utils/constants";
import { getApiErrorMessage, getApiErrorStatus } from "@/utils/apiError";
import axios from "axios";
import { PostVisibility } from "@/types/PostProps";

// Keep the original function for backward compatibility if needed
export const getBulkBlogs = async (q?: string) => {
  try {
    const query = q ? `?q=${encodeURIComponent(q)}` : "";
    const response = await fetch(`${API_URL}/blog/bulk${query}`, {
      // A search is for one reader, so it skips the shared cache.
      next: q ? { revalidate: 0 } : { revalidate: 300 },
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
    visibility: PostVisibility;
  },
  token: string
) => {
  try {
    const response = await axios.post(`${API_URL}/blog/`, payload, {
      headers: { authorization: token },
    });
    return response.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "Failed to save your blog"));
  }
};

export const getBlogById = async (id: string, token?: string) => {
  try {
    const response = await axios.get(`${API_URL}/blog/single/${id}`, {
      headers: token ? { authorization: token } : undefined,
    });
    return response.data;
  } catch (err) {
    if (getApiErrorStatus(err) === 404) return null;
    throw new Error(getApiErrorMessage(err, "Failed to load the blog."));
  }
};

export const editBlog = async (
  postId: string,
  payload: {
    title?: string;
    content?: string;
    image?: string;
    authorId?: string;
    visibility: PostVisibility;
  },
  token: string
) => {
  try {
    const response = await axios.put(`${API_URL}/blog/${postId}`, payload, {
      headers: { authorization: token },
    });
    return response.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "Failed to save your changes"));
  }
};

export const deleteBlog = async (postId: string, token: string) => {
  try {
    const response = await axios.delete(`${API_URL}/blog/${postId}`, {
      headers: { authorization: token },
    });
    return response.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "Failed to delete your blog."));
  }
};
