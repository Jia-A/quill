"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Header nav link that marks itself when its section is the current page. */
const NavLink = ({
  href,
  children,
  match = [],
}: {
  href: string;
  children: React.ReactNode;
  /** Extra path prefixes that belong to this section, e.g. a post under /blog. */
  match?: string[];
}) => {
  const pathname = usePathname();
  const active = [href, ...match].some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`hidden text-sm sm:block ${
        active ? "font-medium text-fg" : "text-muted hover:text-fg"
      }`}
    >
      {children}
    </Link>
  );
};

export default NavLink;
