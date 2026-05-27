"use client";
import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const Input = ({
  label,
  register,
  type = "text",
}: {
  label: string;
  register?: UseFormRegisterReturn<string>;
  type?: string;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <span className="flex flex-col w-full">
      <label htmlFor={label} className="text-sm mb-1 text-foreground">
        {label}
      </label>
      <span className="relative w-full">
        <input
          id={label}
          type={inputType}
          className="border border-border dark:border-muted-foreground/40 rounded p-2 w-full bg-background dark:bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          {...register}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        )}
      </span>
    </span>
  );
};

export default Input;
