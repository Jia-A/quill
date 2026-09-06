export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24 animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <span className="eyebrow">[ Profile ]</span>
          <span className="flex-1 rule" />
        </div>

        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
          <div className="w-24 h-24 border border-border bg-muted shrink-0" />
          <div className="flex-1 min-w-0 space-y-3 pt-1">
            <div className="h-8 w-48 bg-muted" />
            <div className="h-4 w-36 bg-muted" />
          </div>
        </div>

        <div className="mt-16">
          <div className="flex items-center gap-4 mb-8">
            <span className="eyebrow">[ Published ]</span>
            <span className="flex-1 rule" />
          </div>
          <div className="border-t border-border">
            {[0, 1, 2].map((i) => (
              <div key={i} className="py-10 border-b border-border space-y-4">
                <div className="h-3 w-40 bg-muted" />
                <div className="h-8 w-2/3 bg-muted" />
                <div className="h-4 w-full max-w-xl bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
