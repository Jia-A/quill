"use client";

/** Side panel on auth pages — the editorial quote on an ember-ink field. */
const Quote = () => {
  return (
    <div className="h-full flex flex-col justify-between bg-foreground text-background p-12">
      <span className="font-mono text-[0.72rem] tracking-[0.18em] uppercase text-background/50">
        [ Quill — a place to write ]
      </span>

      <blockquote className="max-w-md">
        <p className="font-serif font-light leading-[1.1] tracking-tightest text-4xl xl:text-5xl">
          &ldquo;We write to taste life twice, in the moment{" "}
          <span className="italic text-accent">and in retrospect.</span>&rdquo;
        </p>
        <footer className="mt-8 flex items-baseline gap-3">
          <span className="font-mono text-sm uppercase tracking-[0.18em] text-background/80">
            Anaïs Nin
          </span>
          <span className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-background/40">
            Writer
          </span>
        </footer>
      </blockquote>

      <span className="font-mono text-[0.72rem] tracking-[0.18em] uppercase text-background/40">
        &copy; {new Date().getFullYear()}
      </span>
    </div>
  );
};

export default Quote;
