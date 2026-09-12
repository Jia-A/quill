"use client";
import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Button from "@/atoms/Button";

const Input = ({
  label,
  register,
  ref,
  type = "text",
}: {
  label?: string;
  register?: UseFormRegisterReturn<string>;
  type?: string;
  ref?: any;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <span className="flex flex-col w-full group">
      <label
        htmlFor={label}
        className="eyebrow mb-2 transition-colors group-focus-within:text-accent"
      >
        {label}
      </label>
      <span className="relative w-full">
        <input
          id={label}
          type={inputType}
          ref={ref}
          className="w-full bg-transparent border-b border-border py-2 pr-8 text-foreground text-base focus:outline-none focus:border-accent transition-colors placeholder:text-muted-foreground"
          {...register}
        />
        {isPassword && (
          <Button
            variant="ghost"
            square
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 !w-8 !h-full text-muted-foreground"
            icon={
              showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />
            }
          />
        )}
      </span>
    </span>
  );
};

export default Input;
