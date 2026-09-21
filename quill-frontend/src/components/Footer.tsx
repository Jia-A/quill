import Link from "next/link";

const Footer = ({ signedIn = false }: { signedIn?: boolean }) => {
  return (
    <footer>
      <div className="mx-auto flex max-w-content flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Quill</span>
        <nav className="flex gap-5">
          <Link href="/blogs" className="hover:text-fg">
            Stories
          </Link>
          <Link href={signedIn ? "/editor" : "/auth/signup"} className="hover:text-fg">
            Write
          </Link>
          {!signedIn && (
            <Link href="/auth/signin" className="hover:text-fg">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
