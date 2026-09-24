import { Users, Inbox, Send } from "lucide-react";

/** Feature highlight: a draft shared into a team, visible only to its members. */
const TeamsHighlight = () => {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-content items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
            <Users className="h-3.5 w-3.5" aria-hidden />
            Teams
          </span>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
            Show the draft before the world sees it.
          </h2>

          <p className="mt-3 text-base leading-relaxed text-muted">
            Build a team from people who already write on Quill, then share a post into it straight
            from the editor. Unpublished drafts stay readable by those members and no one else, so
            you can get a second pair of eyes without publishing first.
          </p>

          <ul className="mt-5 space-y-2 text-sm text-muted">
            <li>• Share from the editor, to one team or several</li>
            <li>• Drafts stay private to the team until you publish</li>
            <li>• One page for what you shared and what was shared with you</li>
          </ul>
        </div>

        {/* Mock of a team card from the teams page. */}
        <div className="rounded-lg border border-card-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex shrink-0 -space-x-2" aria-hidden>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-fg text-[11px] font-medium text-bg">
                Y
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-subtle text-[11px] font-medium text-muted ring-1 ring-border">
                M
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-subtle text-[11px] font-medium text-muted ring-1 ring-border">
                R
              </span>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Editing circle</p>
              <p className="text-xs text-muted">
                3 members · <span className="font-medium text-fg">2 posts</span>
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3 border-t border-border pt-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-medium text-muted">
                <Send className="h-3.5 w-3.5" aria-hidden />
                Shared by you
              </p>
              <div className="mt-1.5 rounded-md border border-border px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-medium">What I learned profiling CSS</p>
                  <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                    Draft
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">6 min read</p>
              </div>
            </div>

            <div>
              <p className="flex items-center gap-2 text-xs font-medium text-muted">
                <Inbox className="h-3.5 w-3.5" aria-hidden />
                Shared with you
              </p>
              <div className="mt-1.5 rounded-md border border-border px-3 py-2">
                <p className="text-sm font-medium">A rewrite of the onboarding post</p>
                <p className="mt-1 text-xs text-muted">Maya · 4 min read</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamsHighlight;
