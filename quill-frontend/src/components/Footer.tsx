import Link from "next/link";
import Wordmark from "@/components/Wordmark";

const Footer = () => {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Wordmark href="/" />
        <nav className="flex flex-wrap gap-6">
          <Link href="/blogs" className="eyebrow hover:text-accent transition-colors">
            Read
          </Link>
          <Link href="/auth/signup" className="eyebrow hover:text-accent transition-colors">
            Write
          </Link>
          <Link href="/auth/signin" className="eyebrow hover:text-accent transition-colors">
            Login
          </Link>
        </nav>
        <span className="eyebrow">&copy; {new Date().getFullYear()} Quill</span>
      </div>
    </footer>
  );
};

export default Footer;
