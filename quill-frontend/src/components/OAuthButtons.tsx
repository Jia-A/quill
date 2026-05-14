"use client";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import Button from "../atoms/Button";

interface OAuthButtonsProps {
  callbackUrl?: string;
}

const OAuthButtons = ({ callbackUrl = "/blogs" }: OAuthButtonsProps) => {
  return (
    <div className="w-[350px] mt-6">
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-gray-300" />
        <span className="mx-3 text-xs text-gray-500 uppercase tracking-wider">
          Or continue with
        </span>
        <div className="flex-grow border-t border-gray-300" />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <Button
          label="Google"
          variant="secondary"
          size="sm"
          className="w-full justify-center"
          onClick={() => signIn("google", { callbackUrl })}
          icon={<FcGoogle size={18} />}
        />
        <Button
          label="GitHub"
          variant="secondary"
          size="sm"
          className="w-full justify-center"
          onClick={() => signIn("github", { callbackUrl })}
          icon={<FaGithub size={16} />}
        />
        <Button
          label="LinkedIn"
          variant="secondary"
          size="sm"
          className="w-full justify-center"
          onClick={() => signIn("linkedin", { callbackUrl })}
          icon={<FaLinkedin size={16} color="#0A66C2" />}
        />
      </div>
    </div>
  );
};

export default OAuthButtons;
