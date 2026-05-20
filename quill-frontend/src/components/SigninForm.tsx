"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useRouter } from "next/navigation";
import { type SigninInput } from "@tech--tonic/medium-app-common";
import { signinAction } from "../actions/authActions";
import { signinSchema } from "@/utils/resolvers";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import { signIn } from "next-auth/react";

const SigninForm = () => {
  const router = useRouter();
  const {
    handleSubmit,
    register,
    getValues,
    reset,
    formState: { errors },
  } = useForm<SigninInput>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: "", password: "" },
  });

  const signinHandler = async () => {
    const { email, password } = getValues();
    try {
      const response = await signIn("credentials", {
      email,
      password,
      redirect: false, // we'll handle redirect ourselves so we can show errors
    });
    if (response?.error) {
      console.error("Signin error:", response.error);
      return;
    }
      reset();
      router.push("/blogs");
      router.refresh();
    } catch (error) {
      console.error("Signin error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(signinHandler)}>
      <span className="flex flex-col gap-3 w-[350px] mt-4">
        <Input label="Email" register={register("email")} />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
        <Input label="Password" register={register("password")} />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}
      </span>
      <Button
        label="Sign in"
        type="submit"
        variant="primary"
        className="mt-6 w-full justify-center"
      />
    </form>
  );
};

export default SigninForm;
