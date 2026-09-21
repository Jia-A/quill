import { MessageSquareQuote, Check, X } from "lucide-react";

/** Feature highlight: readers annotate a passage, the author approves it. */
const CommentsHighlight = () => {
  return (
    <section className="border-b border-border bg-bg-subtle">
      <div className="mx-auto grid max-w-content items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
        {/* Mock sits first on wide screens so the page alternates. */}
        <div className="order-last space-y-3 md:order-first">
          <div className="rounded-lg border border-card-border bg-card p-4 shadow-sm">
            <p className="font-serif text-[15px] leading-relaxed">
              Most advice about CSS performance is guesswork. I spent a week profiling a slow page
              and found{" "}
              <mark data-comment-id="demo" data-comment-approved>
                three rendering traps that actually mattered
              </mark>
              , and none of them were the ones I expected.
            </p>
          </div>

          <div className="rounded-lg border border-card-border bg-card p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-bg-subtle" aria-hidden />
              <p className="text-xs font-medium">A reader</p>
              <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">
                Pending
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed">
              Which profiler did you use for this? Would love to try the same workflow.
            </p>
            <div className="mt-3 flex gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-fg bg-fg px-2.5 py-1 text-xs font-medium text-bg">
                <Check className="h-3.5 w-3.5" aria-hidden />
                Approve
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted">
                <X className="h-3.5 w-3.5" aria-hidden />
                Reject
              </span>
            </div>
          </div>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
            <MessageSquareQuote className="h-3.5 w-3.5" aria-hidden />
            Inline comments
          </span>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
            Notes in the margin, with you as the editor.
          </h2>

          <p className="mt-3 text-base leading-relaxed text-muted">
            Readers highlight the exact passage they&rsquo;re responding to and leave a note on it.
            Nothing appears on your post until you approve it, so the conversation stays in the
            margins where it belongs — and the page stays yours.
          </p>

          <ul className="mt-5 space-y-2 text-sm text-muted">
            <li>• Comments anchor to the text, not the bottom of the page</li>
            <li>• Approve or reject each one from your profile</li>
            <li>• Authors are notified the moment a note arrives</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default CommentsHighlight;
