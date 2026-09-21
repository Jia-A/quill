import { PenLine, Globe, Sparkles, Linkedin } from "lucide-react";

const steps = [
  { icon: PenLine, title: "Write your blog", body: "Draft in a clean editor." },
  { icon: Globe, title: "Publish to the world", body: "One click, and it's live." },
  { icon: Sparkles, title: "Generate the post", body: "AI writes the LinkedIn version." },
  { icon: Linkedin, title: "Publish on LinkedIn", body: "Straight to your feed." },
];

const Workflow = () => {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-content px-4 py-14">
        <ol className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="relative">
              {/* Connector to the next step, on one row only. */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-9 right-4 top-[0.875rem] hidden h-px bg-border lg:block"
                />
              )}
              <div className="relative flex h-7 w-7 items-center justify-center rounded-full border border-card-border bg-card">
                <step.icon className="h-3.5 w-3.5 text-accent" aria-hidden />
              </div>
              <h3 className="mt-3 text-sm font-semibold">
                <span className="text-muted">{i + 1}.</span> {step.title}
              </h3>
              <p className="mt-1 text-sm text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Workflow;
