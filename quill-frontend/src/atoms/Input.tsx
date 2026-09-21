"use client";
import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

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
    <div className="flex flex-col w-full">
      <label htmlFor={label} className="text-sm font-medium mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={label}
          type={inputType}
          ref={ref}
          className="w-full rounded-md border border-border bg-bg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-accent"
          {...register}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 px-3 text-muted hover:text-fg"
          >
            {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
