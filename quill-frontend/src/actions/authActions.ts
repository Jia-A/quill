import { API_URL } from "@/utils/constants";
import type { SignupInput } from "@tech--tonic/medium-app-common";
import axios, { isAxiosError } from "axios";

export const signupAction = async (payload: SignupInput) => {
  const signupInp = { ...payload, avatar: "" };
  try {
    const response = await axios.post(`${API_URL}/user/signup`, signupInp);
    return response;
  } catch (error) {
    console.error("Error signing up:", error);
    const message = isAxiosError(error)
      ? (error.response?.data as { error?: { message?: string } })?.error?.message
      : undefined;
    throw new Error(message || "Signup failed");
  }
};
