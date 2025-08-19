'use client'
import { useForm } from "react-hook-form";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import { signupAction, signinAction } from "../actions/authActions";
import type { SignupInput } from "@tech--tonic/medium-app-common";
import { useState } from "react";
// import { useNavigate } from "react-router-dom";

const AuthForm = () => {
  const [isSignupForm, setIsSignupForm] = useState(true);
  // const navigate = useNavigate();
  const {
    handleSubmit: handleSubmitSignup,
    register: registerSignup,
    getValues: getSignupValues,
    reset: resetSignup,
  } = useForm<SignupInput>({
    defaultValues: { name: "", email: "", password: "" },
  });

  const {
    handleSubmit: handleSubmitSignin,
    register: registerSignin,
    getValues: getSigninValues,
    reset: resetSignin,
  } = useForm<SignupInput>({ defaultValues: { email: "", password: "" } });

  const signupHandler = async () => {
    const { name, email, password } = getSignupValues();
    const payload = {
      name,
      email,
      password,
    };
    console.log("Signup payload:", payload);
    try {
      await signupAction(payload);
      resetSignup();
    //   navigate("/blogs");
      console.log("Signup successful");
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  const signinHandler = async () => {
    const { email, password } = getSigninValues();
    const payload = {
      email,
      password,
    };
    try {
      await signinAction(payload);
      resetSignin();
    //   navigate("/blogs");
      console.log("Signup successful");
    } catch (error) {
      console.error("Signin error:", error);
    }
  };

  return (
    <div className="h-screen flex justify-center items-center p-3">
      <div className="flex flex-col gap-2">
        <span className="text-3xl font-extrabold text-center">
          {isSignupForm ? "Create new account" : "Login to your account"}
        </span>
        <div className="flex gap-2 mb-3 text-center justify-center">
          <span className="">
            {isSignupForm
              ? "Already have an account?"
              : "Join the community of writers"}
          </span>
          <span
            className="underline font-bold cursor-pointer"
            onClick={() => setIsSignupForm(prev=> !prev)}
          >
            {isSignupForm ? "Signin here" : "Signup here"}
          </span>
        </div>

        {isSignupForm ? (
          <form onSubmit={handleSubmitSignup(signupHandler)}>
            <span className="flex flex-col gap-3 w-[350px] mt-4">
              <Input label="Fullname" register={registerSignup("name")} />
              <Input label="Email" register={registerSignup("email")} />
              <Input label="Password" register={registerSignup("password")} />
            </span>
            <Button label="Signup" type="submit" />
          </form>
        ) : (
          <form onSubmit={handleSubmitSignin(signinHandler)}>
            <span className="flex flex-col gap-3 w-[350px] mt-4">
              <Input label="Email" register={registerSignin("email")} />
              <Input label="Password" register={registerSignin("password")} />
            </span>
            <Button label="Signup" type="submit" />
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
