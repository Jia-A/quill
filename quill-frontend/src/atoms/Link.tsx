import React from "react";
import Link from "next/link";
import { LinkButtonProps } from "@/types/LinkButtonProps";

const LinkButton = ({ href, className, prefetch, children }: LinkButtonProps) => {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={`group inline-flex items-center gap-3 eyebrow bg-foreground text-background px-6 py-4 hover:bg-accent hover:text-accent-foreground transition-colors ${className}`}
    >
      {children}
    </Link>
  );
};

export default LinkButton;
