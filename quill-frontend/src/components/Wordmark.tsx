"use client";
import Link from "next/link";

/** Editorial wordmark: serif "Quill" with an ember period. */
const Wordmark = ({ href = "/" }: { href?: string }) => {
  return (
    <Link href={href} className="group inline-flex items-baseline select-none">
      <span className="font-serif text-2xl tracking-tightest text-foreground transition-colors group-hover:text-accent">
        Quill
      </span>
      <span className="ml-0.5 text-accent text-2xl leading-none">.</span>
    </Link>
  );
};

export default Wordmark;
