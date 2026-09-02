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
  const [formError, setFormError] = useState("");
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
    setFormError("");
    try {
      await signupAction(payload);
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (response?.error) {
        console.error("Auto sign-in after signup failed:", response.error);
        setFormError("Your account was created, but we couldn't sign you in. Please sign in.");
        setIsSubmitting(false); // failed — stop the loader so they can retry
        return;
      }
      // Success: keep the loader spinning through the redirect (the component
      // unmounts on navigation, so we deliberately don't reset isSubmitting).
      reset();
      router.push("/blogs");
      router.refresh();
    } catch (error) {
      console.error("Signup error:", error);
      setFormError(
        error instanceof Error && error.message ? error.message : "Signup failed. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(signupHandler)}>
      <span className="flex flex-col gap-5 w-full mt-8">
        <Input label="Full name" register={register("name")} />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        <Input label="Email" register={register("email")} />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        <Input label="Password" type="password" register={register("password")} />
        {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
      </span>
      {formError && <p className="text-red-500 text-sm mt-4">{formError}</p>}
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
