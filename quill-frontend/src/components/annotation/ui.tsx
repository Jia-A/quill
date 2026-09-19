"use client";

import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/24/outline";

/** Where a panel is pinned: the on-screen rect it belongs to. */
export type Anchor = { top: number; left: number; width: number };

export const META = "font-mono text-[9px] uppercase tracking-[0.12em]";

export const MiniSpinner = ({ className = "" }: { className?: string }) => (
  <span
    role="status"
    aria-label="Loading"
    className={`inline-block w-3 h-3 border-[1.5px] border-current border-t-transparent rounded-full animate-spin ${className}`}
  />
);

export const PanelInput = (
  props: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> }
) => (
  <input
    type="text"
    autoFocus
    className="w-full bg-transparent border-b border-border pb-1.5 text-[13px] font-serif text-foreground focus:outline-none focus:border-accent transition-colors placeholder:text-muted-foreground disabled:opacity-50"
    {...props}
  />
);

export const TextButton = ({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={`${META} text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer`}
    {...props}
  >
    {children}
  </button>
);

export const AccentButton = ({
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
  <button
    type="button"
    className={`${META} inline-flex items-center justify-center gap-1.5 rounded bg-accent px-2.5 py-1 text-accent-foreground hover:opacity-90 transition-opacity duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
    {...props}
  >
    {loading && <MiniSpinner />}
    {children}
  </button>
);

export const CloseButton = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <div className="flex items-center justify-end px-2 pt-1.5 pb-0.5">
    <button
      type="button"
      className="text-muted-foreground hover:text-accent transition-colors duration-200 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      {...props}
    >
      <XMarkIcon width={12} height={12} />
    </button>
  </div>
);

/** Sign-in prompt shown in place of an input when logged out. */
export const LoginNote = ({ what, onNavigate }: { what: string; onNavigate: () => void }) => (
  <p className="px-3 pb-3 text-[12px] font-serif text-muted-foreground">
    <Link href="/auth/signin" className="text-accent link-underline" onClick={onNavigate}>
      Log in
    </Link>{" "}
    to {what}.
  </p>
);

export const COMPOSE_W = 260;
export const THREAD_W = 264;
const GAP = 8; // breathing room between a panel and the text it annotates

/** The on-screen position of an element or text range. */
export const rectOf = (target: Element | Range): Anchor => {
  const box = target.getBoundingClientRect();
  return { top: box.top, left: box.left, width: box.width };
};

/** Positions a panel centred above its anchor, clamped into the viewport. */
export const panelStyle = (anchor: Anchor, width: number): React.CSSProperties => {
  // Start centred over the thing being annotated.
  const anchorCentre = anchor.left + anchor.width / 2;
  let left = anchorCentre - width / 2;

  // Then pull it back inside the screen if it would hang off either edge.
  if (typeof window !== "undefined") {
    const furthestLeft = window.innerWidth - width - GAP;
    if (left > furthestLeft) left = furthestLeft;
    if (left < GAP) left = GAP;
  }

  return {
    position: "fixed",
    top: anchor.top - GAP,
    left,
    width,
    // Sit above the anchor rather than on top of it.
    transform: "translateY(-100%)",
  };
};

export const panelClass =
  "z-50 max-w-[calc(100vw-1rem)] panel rounded-md animate-pop-in overflow-hidden";
