// Mirrors the real profile: header block, the tab rail, then a comment-style
// list. Keeping the shapes aligned avoids a layout jump when data lands.
const TAB_WIDTHS = ["w-14", "w-20", "w-20", "w-20", "w-16", "w-24"];

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24 animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <span className="eyebrow">[ Profile ]</span>
          <span className="flex-1 rule" />
        </div>

        {/* Header — avatar is w-28 to match Avatar size="xl" */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
          <div className="w-28 h-28 border border-border bg-muted shrink-0" />
          <div className="flex-1 min-w-0 space-y-3 pt-2">
            <div className="h-11 w-56 max-w-full bg-muted" />
            <div className="h-4 w-44 max-w-full bg-muted" />
            <div className="h-4 w-64 max-w-full bg-muted" />
          </div>
          <div className="h-9 w-32 bg-muted shrink-0 self-start" />
        </div>

        {/* Tab rail */}
        <div className="mt-16">
          <div className="border-b border-border flex items-center gap-6 pb-2">
            {TAB_WIDTHS.map((w, i) => (
              <div key={i} className={`h-4 ${w} bg-muted shrink-0`} />
            ))}
          </div>

          {/* Post rows — the page opens on the Published tab, which renders
              BlogList: meta line, large serif title, excerpt, thumbnail. */}
          <div className="mt-10">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-b border-border py-10">
                <div className="flex gap-8 items-start justify-between">
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="h-3.5 w-52 max-w-full bg-muted" />
                    <div className="h-9 w-3/4 bg-muted" />
                    <div className="h-4 w-full max-w-xl bg-muted" />
                  </div>
                  <div className="hidden sm:block w-32 h-24 bg-muted shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
