import { API_URL } from "@/utils/constants";
import type { SignupInput } from "@tech--tonic/medium-app-common";
import axios from "axios";

export const signupAction = async (payload: SignupInput) => {
  const signupInp = { ...payload, avatar: "" };
  try {
    const response = await axios.post(`${API_URL}/user/signup`, signupInp);
    return response;
  } catch (error) {
    console.error("Error signing up:", error);
    if (error?.response && error?.response?.data && error.response?.data?.error) {
      const errorData = error.response.data.error;
      throw new Error(errorData.message || "Signup failed");
    } else {
      throw new Error("Signup failed");
    }
  }
};
