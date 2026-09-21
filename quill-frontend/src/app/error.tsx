"use client";

import { useEffect } from "react";
import Link from "next/link";
import Button from "@/atoms/Button";

const Error = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-sm text-muted">Something went wrong</p>
      <h1 className="mt-2 text-xl font-semibold">{`This page didn't load`}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Something broke on our end. Try again in a moment — if it keeps happening, the server may be
        temporarily unavailable.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button variant="primary" label="Try again" onClick={reset} />
        <Link href="/blogs" className="text-sm text-muted hover:text-fg">
          Browse all stories
        </Link>
      </div>

      {error.digest && <p className="mt-8 text-xs text-muted">Reference: {error.digest}</p>}
    </main>
  );
};

export default Error;
