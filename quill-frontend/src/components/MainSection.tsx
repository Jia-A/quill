import Button from "@/atoms/Button";
import Link from "next/link";
import React from "react";

const MainSection = () => {

  return (
    <section className="relative flex flex-col items-center justify-center text-center px-6 h-[90vh] max-w-4xl mx-auto">
      <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
        Write. Publish. Share. <br /> All in One Click.
      </h1>
      <p className="text-lg text-[var(--color-primary-light)] mb-10 max-w-2xl">
        From blogs to community posts to AI-powered LinkedIn & Twitter updates -
        all with a single click.
      </p>
      {/* <button className="px-10 py-4 rounded-2xl bg-gradient-to-r from-[var(--color-pink)] via-[var(--color-purple)] to-[var(--color-blue)] text-[var(--color-primary-dark)] font-semibold shadow-lg hover:opacity-90 transition text-lg">
        Get Started Free →
      </button> */}
      <Link href={"/blogs"}>
        <Button variant="primary" size="lg" label="Get Started Free →" />
      </Link>

      {/* Subtle Gradient Accent */}
      <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-[var(--color-blue)] via-[var(--color-pink)] to-[var(--color-purple)] opacity-20 blur-3xl" />
    </section>
  );
};

export default MainSection;
