// Mirrors the real profile: header block, tab rail, then a list of posts.
// Keeping the shapes aligned avoids a layout jump when data lands.
const TAB_WIDTHS = ["w-14", "w-20", "w-20", "w-20", "w-16", "w-24"];

export default function ProfileLoading() {
  return (
    <main className="mx-auto max-w-content animate-pulse px-4 py-10">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 rounded-full bg-bg-subtle" />
        <div className="flex-1 space-y-2 pt-2">
          <div className="h-6 w-48 max-w-full rounded bg-bg-subtle" />
          <div className="h-4 w-40 max-w-full rounded bg-bg-subtle" />
        </div>
      </div>

      <div className="mt-8 flex items-center gap-5 border-b border-border pb-2">
        {TAB_WIDTHS.map((w, i) => (
          <div key={i} className={`h-4 ${w} shrink-0 rounded bg-bg-subtle`} />
        ))}
      </div>

      <div className="mt-6 divide-y divide-border border-y border-border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 py-5">
            <div className="h-5 w-2/3 rounded bg-bg-subtle" />
            <div className="h-4 w-full max-w-xl rounded bg-bg-subtle" />
            <div className="h-3 w-40 rounded bg-bg-subtle" />
          </div>
        ))}
      </div>
    </main>
  );
}
