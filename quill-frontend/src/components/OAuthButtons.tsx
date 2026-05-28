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
    <div className="w-full mt-8">
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-border" />
        <span className="mx-3 eyebrow">Or continue with</span>
        <div className="flex-grow border-t border-border" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-5">
        <Button
          label="Google"
          variant="secondary"
          size="sm"
          className="w-full justify-center"
          onClick={() => signIn("google", { callbackUrl })}
          icon={<FcGoogle className="w-[18px] h-[18px]" />}
        />
        <Button
          label="GitHub"
          variant="secondary"
          size="sm"
          className="w-full justify-center"
          onClick={() => signIn("github", { callbackUrl })}
          icon={<FaGithub className="w-[18px] h-[18px]" />}
        />
        <Button
          label="LinkedIn"
          variant="secondary"
          size="sm"
          className="w-full justify-center"
          onClick={() => signIn("linkedin", { callbackUrl })}
          icon={<FaLinkedin className="w-[18px] h-[18px]" color="#0A66C2" />}
        />
      </div>
    </div>
  );
};

export default OAuthButtons;
