import { API_URL } from "@/utils/constants";
import axios from "axios";

export const getComments = async (postId: string, token?: string) => {
  const response = await fetch(`${API_URL}/comment/${postId}`, {
    headers: token ? { authorization: token } : undefined,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch comments: ${response.status}`);
  }
  return response.json();
};

export const getPendingComments = async (token?: string) => {
  const response = await fetch(`${API_URL}/comment/pending`, {
    headers: token ? { authorization: token } : undefined,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch pending comments: ${response.status}`);
  }
  return response.json();
};

export const patchCommentStatus = async (id: string, status: string, token?: string) => {
  try {
    const response = await axios.patch(
      `${API_URL}/comment/${id}`,
      {
        status,
      },
      {
        headers: token ? { authorization: token } : undefined,
      }
    );
    console.log(response);
    if (response) return response;
  } catch (err) {
    console.error(err);
    throw new Error(
      err?.response?.data?.error?.message ?? "Failed to change the status of the comment"
    );
  }
};

export const postComments = async (
  payload: {
    text: string;
    postId: string;
    startOffset?: number;
    endOffset?: number;
    anchorText?: string;
    parentId?: string;
  },
  token: string
) => {
  try {
    const response = await axios.post(`${API_URL}/comment/`, payload, {
      headers: { authorization: token },
    });
    return response.data;
  } catch (err) {
    throw new Error(err?.response?.data?.error?.message ?? "Failed to save the comment");
  }
};
