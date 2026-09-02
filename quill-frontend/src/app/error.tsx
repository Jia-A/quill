"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";
import Link from "next/link";

// Catches anything thrown while rendering a page. Next replaces the real message
// with a generic one in production (the details stay in the server logs), so this
// deliberately shows our own copy rather than error.message.
const Error = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <span className="eyebrow accent-text block mb-4">[ Something went wrong ]</span>
        <h1 className="font-serif text-3xl tracking-tightest mb-4">This page didn&apos;t load</h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          Something broke on our end. Try again in a moment — if it keeps happening, the server may
          be temporarily unavailable.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="group inline-flex items-center gap-3 eyebrow bg-foreground text-background px-6 py-4 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <RotateCw className="w-4 h-4 transition-transform group-hover:rotate-90" />
            Try again
          </button>
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
