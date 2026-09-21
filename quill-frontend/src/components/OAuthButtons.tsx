"use client";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import Button from "../atoms/Button";
import { useState } from "react";

interface OAuthButtonsProps {
  callbackUrl?: string;
}

const OAuthButtons = ({ callbackUrl = "/blogs" }: OAuthButtonsProps) => {
  // Which provider is mid-redirect. signIn() navigates away, so this is never
  // cleared on success — it only needs to survive until the page unloads.
  const [pending, setPending] = useState<"google" | "github" | "linkedin" | null>(null);

  const handleSignIn = (provider: "google" | "github" | "linkedin") => {
    setPending(provider);
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="mt-5 border-t border-border pt-5">
      <p className="mb-3 text-center text-xs text-muted">Or continue with</p>

      <div className="grid grid-cols-3 gap-2">
        <Button
          label={<span className="hidden sm:inline">Google</span>}
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => handleSignIn("google")}
          loading={pending === "google"}
          disabled={pending !== null}
          icon={<FcGoogle className="w-4 h-4" />}
        />
        <Button
          label={<span className="hidden sm:inline">GitHub</span>}
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => handleSignIn("github")}
          loading={pending === "github"}
          disabled={pending !== null}
          icon={<FaGithub className="w-4 h-4" />}
        />
        <Button
          label={<span className="hidden sm:inline">LinkedIn</span>}
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => handleSignIn("linkedin")}
          loading={pending === "linkedin"}
          disabled={pending !== null}
          icon={<FaLinkedin className="w-4 h-4" color="#0A66C2" />}
        />
      </div>
    </div>
  );
};

export default OAuthButtons;
