"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { MiniSpinner } from "./annotation/ui";

const DEBOUNCE_MS = 300;

// The query lives in the URL, not in state: a search can be shared or
// bookmarked, and the back button steps through searches as a reader expects.
const SearchBox = ({ q, children }: { q: string; children: React.ReactNode }) => {
  const router = useRouter();
  const [text, setText] = useState(q);
  // The transition stays pending until the server sends the new list back, so
  // this is the real fetch, not a guess at how long one takes.
  const [pending, startTransition] = useTransition();

  // Skip the run on mount: the page already shows the results for `q`.
  const current = useRef(q);

  useEffect(() => {
    const value = text.trim();
    if (value === current.current) return;

    // Wait for a pause in typing so each keystroke isn't its own request.
    const timer = setTimeout(() => {
      current.current = value;
      startTransition(() => {
        router.push(value ? `/blogs?q=${encodeURIComponent(value)}` : "/blogs");
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [text, router]);

  const field = (
    <div className="relative mt-4">
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        name="q"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search stories or authors"
        aria-label="Search stories"
        className="w-full rounded-md border border-border bg-bg py-2 pl-9 pr-9 text-sm outline-none placeholder:text-muted focus:border-accent"
      />
      {pending && <MiniSpinner className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />}
    </div>
  );

  return (
    <>
      {field}
      {/* Fade the previous results while the next ones load, so what's on
          screen doesn't read as the answer to what was just typed. */}
      <div className={pending ? "opacity-50 transition-opacity" : undefined}>{children}</div>
    </>
  );
};

export default SearchBox;
