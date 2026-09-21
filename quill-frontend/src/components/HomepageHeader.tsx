import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";
import NavLink from "@/components/NavLink";

const HomepageHeader = () => {
  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border bg-bg">
      <div className="mx-auto flex h-full max-w-content items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Wordmark href="/" />
          <NavLink href="/blogs" match={["/blog", "/author"]}>
            Stories
          </NavLink>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/auth/signin"
            className="rounded-md px-3 py-1.5 text-sm text-fg hover:bg-bg-subtle"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-md border border-fg bg-fg px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
};

export default HomepageHeader;
