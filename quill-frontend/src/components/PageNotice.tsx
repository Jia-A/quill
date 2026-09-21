import Button from "@/atoms/Button";

// Full-page state for outcomes that aren't a 404 — a failed lookup, a post that
// isn't yours. Mirrors the not-found page's layout so the app's error states
// read as one family.
const PageNotice = ({
  label,
  title,
  message,
  href = "/blogs",
  action = "Browse all stories",
}: {
  label: string;
  title: string;
  message: string;
  href?: string;
  action?: string;
}) => (
  <main className="mx-auto max-w-md px-4 py-20 text-center">
    <p className="text-sm text-muted">{label}</p>
    <h1 className="mt-2 text-xl font-semibold">{title}</h1>
    <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>
    <div className="mt-6 flex justify-center">
      <Button href={href} variant="primary" label={action} />
    </div>
  </main>
);

export default PageNotice;
