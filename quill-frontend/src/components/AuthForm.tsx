"use client";
import { useForm } from "react-hook-form";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import { signupAction, signinAction } from "../actions/authActions";
import { type SignupInput, SigninInput } from "@tech--tonic/medium-app-common";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, signinSchema } from "@/utils/resolvers";
import { useRouter } from "next/navigation";

const AuthForm = () => {
  const [isSignupForm, setIsSignupForm] = useState(true);
  const router = useRouter();
  const {
    handleSubmit: handleSubmitSignup,
    register: registerSignup,
    getValues: getSignupValues,
    reset: resetSignup,
    formState: { errors: signupErrors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const {
    handleSubmit: handleSubmitSignin,
    register: registerSignin,
    getValues: getSigninValues,
    reset: resetSignin,
    formState: { errors: signinErrors },
  } = useForm<SigninInput>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupHandler = async () => {
    const { name, email, password } = getSignupValues();
    const payload = {
      name,
      email,
      password,
    };
    console.log("Signup payload:", payload);
    try {
      const response = await signupAction(payload);
      resetSignup();
      localStorage.setItem("customer", JSON.stringify(response.user));
      router.push("/blogs");
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
      const response = await signinAction(payload);
      resetSignin();
      localStorage.setItem("customer", JSON.stringify(response.userExists));
      router.push("/blogs");
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
            onClick={() => setIsSignupForm((prev) => !prev)}
          >
            {isSignupForm ? "Signin here" : "Signup here"}
          </span>
        </div>

        {isSignupForm ? (
          <form onSubmit={handleSubmitSignup(signupHandler)}>
            <span className="flex flex-col gap-3 w-[350px] mt-4">
              <Input label="Fullname" register={registerSignup("name")} />
              {signupErrors.name && (
                <p className="text-red-500 text-sm">
                  {signupErrors.name.message}
                </p>
              )}
              <Input label="Email" register={registerSignup("email")} />
              {signupErrors.email && (
                <p className="text-red-500 text-sm">
                  {signupErrors.email.message}
                </p>
              )}
              <Input label="Password" register={registerSignup("password")} />
              {signupErrors.password && (
                <p className="text-red-500 text-sm">
                  {signupErrors.password.message}
                </p>
              )}
            </span>
            <Button label="Signup" type="submit" variant="primary" className="mt-6 w-full md:w-1/2 justify-center" />
          </form>
        ) : (
          <form onSubmit={handleSubmitSignin(signinHandler)}>
            <span className="flex flex-col gap-3 w-[350px] mt-4">
              <Input label="Email" register={registerSignin("email")} />
              {signinErrors.email && (
                <p className="text-red-500 text-sm">
                  {signinErrors.email.message}
                </p>
              )}
              <Input label="Password" register={registerSignin("password")} />
              {signinErrors.password && (
                <p className="text-red-500 text-sm">
                  {signinErrors.password.message}
                </p>
              )}
            </span>
            <Button
              label="Signin"
              type="submit"
              variant="primary"
              className="mt-6 w-full md:w-1/2 justify-center"
            />
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
