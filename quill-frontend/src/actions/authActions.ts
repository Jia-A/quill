import { API_URL } from "@/utils/constants";
import type { SignupInput } from "@tech--tonic/medium-app-common";
import axios from "axios";

export const signupAction = async (payload: SignupInput) => {
  const signupInp = { ...payload, avatar: "" };
  const response = await axios.post(`${API_URL}/user/signup`, signupInp);
  if (response.status === 200) {
    return response.data;
  } else {
    throw new Error("Signup failed");
  }
};
