"use client";

import { useEffect, useState } from "react";

type Page<T> = { rows: T[]; nextCursor: string | null };

/**
 * A list that grows by one page at a time.
 *
 * `fetchPage` is given a cursor and returns that page's rows plus the cursor
 * after it; a null cursor means there's nothing more to load.
 *
 * Pass `initial` when the first page is already in hand (server-rendered).
 * Leave it out and the hook fetches the first page itself, reporting `loading`
 * while it does.
 */
export function usePagedList<T>(
  fetchPage: (cursor?: string) => Promise<Page<T>>,
  initial?: Page<T>
) {
  const [rows, setRows] = useState<T[]>(initial?.rows ?? []);
  const [cursor, setCursor] = useState(initial?.nextCursor ?? null);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    fetchPage()
      .then((page) => {
        if (cancelled) return;
        setRows(page.rows);
        setCursor(page.nextCursor);
      })
      .catch((err) => console.error("Failed to load list:", err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // Runs once: the first page never depends on anything that changes here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = async () => {
    if (!cursor) return;
    const page = await fetchPage(cursor);
    setRows((prev) => [...prev, ...page.rows]);
    setCursor(page.nextCursor);
  };

  return { rows, setRows, loading, hasMore: Boolean(cursor), loadMore };
}
