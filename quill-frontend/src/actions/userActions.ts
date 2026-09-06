import { API_URL } from "@/utils/constants";
import axios from "axios";

export const getUserProfile = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/user/me`, {
      headers: { authorization: token },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching user profile:", err.response?.data?.error);
    throw new Error(err.response?.data?.error?.message || "Something went wrong");
  }
};

export const getPublicUserProfile = async (id: string) => {
  try {
    const response = await axios.get(`${API_URL}/user/${id}`);
    return response.data;
  } catch (err) {
    if (err?.response?.status === 404) return null;
    throw new Error(err.response?.data?.error?.message || "Something went wrong");
  }
};

export const updateUserProfile = async (token, payload) => {
  try {
    const response = await axios.put(`${API_URL}/user/me`, payload, {
      headers: { authorization: token },
    });
    return response.data;
  } catch (err) {
    console.error("Error updating user profile:", err.response?.data?.error);
    throw new Error(err.response?.data?.error?.message || "Something went wrong");
  }
};
