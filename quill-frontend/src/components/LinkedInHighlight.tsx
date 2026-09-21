import { Sparkles, ThumbsUp, MessageSquare, Repeat2 } from "lucide-react";

/** Feature highlight: the article becomes a LinkedIn post you can edit and send. */
const LinkedInHighlight = () => {
  return (
    <section className="border-b border-border bg-bg-subtle">
      <div className="mx-auto grid max-w-content items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            AI social drafts
          </span>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
            Your article, rewritten for LinkedIn.
          </h2>

          <p className="mt-3 text-base leading-relaxed text-muted">
            Quill reads your finished post and writes a LinkedIn version of it — a strong hook, the
            concrete details, and the right length for the feed. Edit it, regenerate it, then
            publish to your profile without leaving the page.
          </p>

          <ul className="mt-5 space-y-2 text-sm text-muted">
            <li>• Generated from your title, content, and summary</li>
            <li>• Fully editable, and saved per post</li>
            <li>• Published through your connected LinkedIn account</li>
          </ul>
        </div>

        {/* Mock of the generated post. */}
        <div className="rounded-lg border border-card-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-bg-subtle" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium">Your name</p>
              <p className="text-xs text-muted">Writer · Just now</p>
            </div>
          </div>

          <p className="mt-3 text-sm leading-relaxed">
            Most advice about CSS performance is guesswork.
            <br />
            <br />
            I spent a week profiling a slow page and found three rendering traps that actually
            mattered — and none of them were the ones I expected.
            <br />
            <br />
            Here&rsquo;s what I&rsquo;d check first 👇
          </p>

          <div className="mt-4 flex items-center gap-5 border-t border-border pt-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
              142
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              28
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Repeat2 className="h-4 w-4" aria-hidden />9
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LinkedInHighlight;
