import { API_URL } from "@/utils/constants";
import axios from "axios";

// Keep the original function for backward compatibility if needed
export const getBulkBlogs = async () => {
  const response = await fetch(`${API_URL}/blog/bulk`, {
    next: { revalidate: 300 } // Enable ISR with 5-minute revalidation
  });
  console.log(response);
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Can't fetch blogs right now!");
  }
};

export const postBlog = async (payload: {
  title: string;
  content: string;
  image: string;
  published: boolean;
}) => {
  try {
    const response = await axios.post(`${API_URL}/blog/`, payload, {
      headers: { authorization: `${localStorage.getItem("token")}` },
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch {
    throw new Error("Error creating blog");
  }
};

export const getBlogById = async (id: string) => {
  try {
    const response = await axios.get(`${API_URL}/blog/single/${id}`);
    if (response.status === 200) {
      return response.data;
    }
  } catch {
    throw new Error("Error fetching blog by ID");
  }
};
