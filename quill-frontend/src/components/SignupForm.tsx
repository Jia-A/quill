"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type SignupInput } from "@tech--tonic/medium-app-common";
import { signupAction } from "../actions/authActions";
import { signupSchema } from "@/utils/resolvers";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import { signIn } from "next-auth/react";
import { useState } from "react";

const SignupForm = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    handleSubmit,
    register,
    getValues,
    reset,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const signupHandler = async () => {
    const { name, email, password } = getValues();
    const payload = { name, email, password };
    setIsSubmitting(true);
    try {
      await signupAction(payload);
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (response?.error) {
        console.error("Auto sign-in after signup failed:", response.error);
        return;
      }
      reset();
      router.push("/blogs");
      router.refresh();
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(signupHandler)}>
      <span className="flex flex-col gap-3 w-[350px] mt-4">
        <Input label="Full name" register={register("name")} />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        <Input label="Email" register={register("email")} />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        <Input label="Password" type="password" register={register("password")} />
        {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
      </span>
      <Button
        label={isSubmitting ? "Signing up..." : "Signup"}
        type="submit"
        variant="primary"
        loading={isSubmitting}
        className="mt-6 w-full justify-center"
      />
    </form>
  );
};

export default SignupForm;
