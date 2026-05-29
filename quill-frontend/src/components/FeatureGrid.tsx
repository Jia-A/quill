"use client";
import { motion } from "framer-motion";
import Link from "next/link";

const features = [
  {
    no: "01",
    title: "A page, nothing more",
    body: "A clean editor that gets out of your way. Headings, emphasis, lists, images — the essentials, none of the clutter.",
  },
  {
    no: "02",
    title: "Publish in one click",
    body: "Write it, ship it. Your words go live the moment you're ready, formatted for comfortable long-form reading.",
  },
  {
    no: "03",
    title: "Built for readers",
    body: "Generous type, real typography, light and dark. Every story is set to be read, not just scrolled past.",
  },
];

const FeatureGrid = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-10 py-24 md:py-32">
      <div className="flex items-center gap-4 mb-16">
        <span className="eyebrow">[ 03 — The surface ]</span>
        <span className="flex-1 rule" />
      </div>

      <div className="grid md:grid-cols-3 border-t border-border">
        {features.map((f, i) => (
          <motion.div
            key={f.no}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="border-b md:border-b-0 md:border-r last:border-r-0 border-border py-10 md:py-12 md:px-8 first:md:pl-0 group"
          >
            <span className="font-mono text-sm text-accent">{f.no}</span>
            <h3 className="font-serif text-2xl md:text-3xl mt-5 mb-4 tracking-tightest">
              {f.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed max-w-xs">{f.body}</p>
          </motion.div>
        ))}
      </div>

      {/* Closing CTA band */}
      <div className="mt-24 md:mt-32 border-t border-border pt-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <h2 className="font-serif font-light leading-[0.95] tracking-tightest text-[clamp(2rem,6vw,4.5rem)]">
          Your first <span className="italic accent-text">story</span>
          <br />
          starts here.
        </h2>
        <Link href="/auth/signup">
          <span className="group inline-flex items-center gap-3 eyebrow bg-foreground text-background px-6 py-4 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer whitespace-nowrap">
            Start writing
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </span>
        </Link>
      </div>
    </section>
  );
};

export default FeatureGrid;
