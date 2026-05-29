import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";

const HomepageHeader = () => {
  return (
    <header className="w-full flex justify-between items-center px-5 md:px-10 h-[61px] bg-background/80 backdrop-blur border-b border-border sticky top-0 z-50">
      <Wordmark href="/" />
      <div className="flex items-center gap-4 sm:gap-6">
        <Link
          href="/blogs"
          className="hidden sm:inline eyebrow text-foreground hover:text-accent transition-colors"
        >
          Read
        </Link>
        <ThemeToggle />
        <Link
          href="/auth/signin"
          className="eyebrow text-foreground hover:text-accent active:text-accent transition-colors"
        >
          Login
        </Link>
        <Link
          href="/auth/signup"
          className="eyebrow whitespace-nowrap bg-foreground text-background px-3.5 py-2 sm:px-4 hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground transition-colors"
        >
          <span className="sm:hidden">Write</span>
          <span className="hidden sm:inline">Start writing</span>
        </Link>
      </div>
    </header>
  );
};

export default HomepageHeader;
