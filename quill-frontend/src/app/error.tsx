"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";
import Link from "next/link";
import Button from "@/atoms/Button";

const Error = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <span className="eyebrow accent-text block mb-4">[ Something went wrong ]</span>
        <h1 className="font-serif text-3xl tracking-tightest mb-4">{`This page didn't load`}</h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          Something broke on our end. Try again in a moment - if it keeps happening, the server may
          be temporarily unavailable.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            variant="primary"
            label="Try again"
            icon={<RotateCw className="w-4 h-4 transition-transform group-hover:rotate-90" />}
            onClick={reset}
          />
          <Link
            href="/blogs"
            className="eyebrow link-underline text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse all stories
          </Link>
        </div>
        {error.digest && (
          <p className="eyebrow text-muted-foreground/60 mt-10">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
};

export default Error;
