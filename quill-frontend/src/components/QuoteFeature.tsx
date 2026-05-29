"use client";
import { motion } from "framer-motion";

/**
 * The Anaïs Nin quote as a full-bleed editorial centerpiece.
 * Carries the same line that lives on the auth pages, blown up large.
 */
const QuoteFeature = () => {
  return (
    <section className="border-y border-border bg-foreground text-background">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-24 md:py-36">
        <div className="flex items-center gap-4 mb-12">
          <span className="font-mono text-[0.72rem] tracking-[0.18em] uppercase text-background/50">
            [ 02 — Why write ]
          </span>
          <span className="flex-1 h-px bg-background/20" />
        </div>

        <motion.blockquote
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="font-serif font-light leading-[1.05] tracking-tightest text-[clamp(2rem,6vw,5rem)] max-w-5xl"
        >
          &ldquo;We write to taste life twice, in the moment{" "}
          <span className="italic text-accent">and in retrospect.</span>&rdquo;
        </motion.blockquote>

        <div className="mt-12 flex items-baseline gap-4">
          <span className="font-mono text-sm uppercase tracking-[0.18em] text-background/80">
            Anaïs Nin
          </span>
          <span className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-background/40">
            Writer &amp; philosopher
          </span>
        </div>
      </div>
    </section>
  );
};

export default QuoteFeature;
