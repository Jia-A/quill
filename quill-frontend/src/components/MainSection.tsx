import Link from "next/link";

/** Hero: the Nin line the product is named for, then the two calls to action. */
const MainSection = ({ signedIn }: { signedIn: boolean }) => {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Soft accent glow behind the quote. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[760px] -translate-x-1/2 rounded-full bg-accent opacity-[0.06] blur-3xl"
      />

      <div className="relative mx-auto max-w-content px-4 py-20 text-center md:py-28">
        <blockquote>
          <p className="mx-auto max-w-3xl font-serif text-3xl leading-snug md:text-5xl">
            “We write to taste life twice, in the moment{" "}
            <span className="italic text-accent">and in retrospect.</span>”
          </p>
          <footer className="mt-5 text-sm text-muted">Anaïs Nin</footer>
        </blockquote>

        <p className="mx-auto mt-10 max-w-xl text-base leading-relaxed text-muted">
          Quill is a distraction-free home for long-form writing — and a one-click path from a
          finished article to a LinkedIn post.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={signedIn ? "/editor" : "/auth/signup"}
            className="rounded-md border border-fg bg-fg px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
          >
            Start writing
          </Link>
          {!signedIn && (
            <Link
              href="/auth/signin"
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-bg-subtle"
            >
              Log in
            </Link>
          )}
          <Link href="/blogs" className="px-1 text-sm text-muted hover:text-fg">
            Browse stories
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MainSection;
