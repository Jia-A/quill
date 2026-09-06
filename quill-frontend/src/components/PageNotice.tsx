import { ArrowLeft } from "lucide-react";
import LinkButton from "@/atoms/Link";

// Full-page state for outcomes that aren't a 404 — a failed lookup, a post that
// isn't yours. Mirrors the not-found page's layout so the app's error states
// read as one family.
const PageNotice = ({
  eyebrow,
  title,
  message,
  href = "/blogs",
  action = "Browse all stories",
}: {
  eyebrow: string;
  title: string;
  message: string;
  href?: string;
  action?: string;
}) => (
  <div className="min-h-screen bg-background flex items-center justify-center px-6">
    <div className="max-w-lg text-center">
      <span className="eyebrow accent-text block mb-4">{eyebrow}</span>
      <h1 className="font-serif text-3xl tracking-tightest mb-4">{title}</h1>
      <p className="text-muted-foreground mb-10 leading-relaxed">{message}</p>
      <LinkButton href={href}>
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        {action}
      </LinkButton>
    </div>
  </div>
);

export default PageNotice;
