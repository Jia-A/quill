import Link from "next/link";

/** Serif wordmark with an ember period — the one piece of the page that is a logo. */
const Wordmark = ({ href = "/" }: { href?: string }) => {
  return (
    <Link href={href} className="group inline-flex items-baseline select-none">
      <span className="font-serif text-xl leading-none tracking-tight text-fg group-hover:text-accent">
        Quill
      </span>
      <span className="ml-px text-xl leading-none text-accent">.</span>
    </Link>
  );
};

export default Wordmark;
