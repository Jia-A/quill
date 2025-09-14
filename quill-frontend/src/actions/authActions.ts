import { API_URL } from "@/utils/constants"
import type { SignupInput, SigninInput } from "@tech--tonic/medium-app-common"
import axios from "axios"


export const signupAction = async (payload : SignupInput) => {
    const signupInp = {...payload, avatar : ""}
    const response = await axios.post(`${API_URL}/user/signup`, signupInp)
    if (response.status === 200) {
        localStorage.setItem("token", response.data.token)
        return response.data
    } else {
        throw new Error("Signup failed")
    }
}

export const signinAction = async (payload : SigninInput) => {
    const response = await axios.post(`${API_URL}/user/signin`, payload)
    if (response.status === 200) {
        localStorage.setItem("token", response.data.token)
        return response.data
    } else {
        throw new Error("Signin failed")
    }
}