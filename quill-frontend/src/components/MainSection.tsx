import Link from "next/link";

const MainSection = () => {
  return (
    <section className="relative px-6 md:px-10 pt-24 pb-28 md:pt-36 md:pb-40 max-w-6xl mx-auto">
      {/* Kicker */}
      <div className="flex items-center gap-4 mb-10 animate-rise">
        <span className="eyebrow">[ 01 — A writing surface ]</span>
        <span className="flex-1 rule" />
      </div>

      {/* Display headline — editorial serif, oversized */}
      <h1
        className="font-serif font-light leading-[0.95] tracking-tightest text-[clamp(2.75rem,9vw,7.5rem)] animate-rise"
        style={{ animationDelay: "0.05s" }}
      >
        Write to taste
        <br />
        life <span className="italic accent-text">twice.</span>
      </h1>

      <div
        className="mt-12 grid md:grid-cols-[1.4fr_1fr] gap-10 items-end animate-rise"
        style={{ animationDelay: "0.12s" }}
      >
        <p className="max-w-xl text-lg md:text-xl leading-relaxed text-muted-foreground">
          Quill is a clean, distraction-free home for your words. Draft, publish, and share
          long-form writing &mdash; no clutter, no noise. Just you and the page.
        </p>

        <div className="flex flex-col gap-4 md:items-end">
          <Link href="/auth/signup">
            <span className="group inline-flex items-center gap-3 eyebrow bg-foreground text-background px-6 py-4 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
              Start writing
              <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </span>
          </Link>
          <Link
            href="/blogs"
            className="eyebrow link-underline text-muted-foreground hover:text-foreground transition-colors"
          >
            or read the latest
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MainSection;
