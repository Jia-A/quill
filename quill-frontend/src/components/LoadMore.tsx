"use client";

import { useState } from "react";

/** "Load more" button that shows a spinner while its handler runs. */
const LoadMore = ({ onClick }: { onClick: () => Promise<void> }) => {
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = async () => {
    setLoading(true);
    setFailed(false);
    try {
      await onClick();
    } catch (err) {
      console.error("Failed to load more:", err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-6 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 border border-border font-mono text-[11px] tracking-[0.12em] text-muted-foreground hover:text-accent hover:border-accent transition-colors duration-300 ease-out cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        {loading && (
          <span className="inline-block w-3 h-3 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
        )}
        {loading ? "Loading" : "Load more"}
      </button>
      {failed && (
        <p className="font-mono text-[11px] tracking-[0.12em] text-destructive">
          {`Couldn't load more. Try again.`}
        </p>
      )}
    </div>
  );
};

export default LoadMore;
