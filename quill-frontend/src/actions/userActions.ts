import { API_URL } from "@/utils/constants";
import { getApiErrorMessage, getApiErrorStatus } from "@/utils/apiError";
import axios from "axios";

export const getUserProfile = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/user/me`, {
      headers: { authorization: token },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    throw new Error(getApiErrorMessage(err, "Something went wrong."));
  }
};

export const getPublicUserProfile = async (id: string) => {
  try {
    const response = await axios.get(`${API_URL}/user/${id}`);
    return response.data;
  } catch (err) {
    if (getApiErrorStatus(err) === 404) return null;
    throw new Error(getApiErrorMessage(err, "Something went wrong"));
  }
};

export const updateUserProfile = async (
  token: string,
  payload: { name: string; aboutAuthor: string; avatar?: string }
) => {
  try {
    const response = await axios.put(`${API_URL}/user/me`, payload, {
      headers: { authorization: token },
    });
    return response.data;
  } catch (err) {
    console.error("Error updating user profile:", err);
    throw new Error(getApiErrorMessage(err, "Something went wrong"));
  }
};
