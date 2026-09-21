import Link from "next/link";
import { BookOpen, Users, Moon } from "lucide-react";

const points = [
  {
    icon: BookOpen,
    title: "Built for reading",
    body: "Real typography, a sane measure, and no interstitials between a reader and your words.",
  },
  {
    icon: Users,
    title: "Author profiles",
    body: "Every writer gets a page that collects their published work in one place.",
  },
  {
    icon: Moon,
    title: "Light and dark",
    body: "A considered theme for either, so reading is comfortable whatever the hour.",
  },
];

const ReadingHub = ({ signedIn }: { signedIn: boolean }) => {
  return (
    <section>
      <div className="mx-auto max-w-content px-4 py-16 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight">A noiseless reading hub.</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          No feeds to fight, no popups, no paywall prompts. Just the stories people wrote and the
          space to read them.
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {points.map((p) => (
            <div key={p.title}>
              <p.icon className="h-5 w-5 text-accent" aria-hidden />
              <h3 className="mt-3 text-sm font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              {signedIn ? "Ready for your next post?" : "Your first story starts here."}
            </h3>
            <p className="mt-1 text-sm text-muted">
              Write it, publish it, and share it — in one place.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link
              href={signedIn ? "/editor" : "/auth/signup"}
              className="rounded-md border border-fg bg-fg px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
            >
              Start writing
            </Link>
            <Link
              href="/blogs"
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-bg-subtle"
            >
              Browse stories
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReadingHub;
