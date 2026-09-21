"use client";

import Link from "next/link";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { getNotifications } from "@/actions/notificationAction";
import { useNotifications, type Notification } from "@/providers/NotificationProvider";
import { TYPE_LABELS, relativeTime, hrefFor } from "@/utils/notificationFormat";
import { usePagedList } from "@/utils/usePagedList";
import LoadMore from "./LoadMore";

/**
 * Notification feed for the profile Activity tab. Unlike the header dropdown
 * this shows read ones too, so it fetches its own list instead of reading the
 * provider's unread-only state.
 */
const ProfileNotificationsList = () => {
  const { data: session } = useSession();
  const { markAsRead } = useNotifications();
  const token = session?.backendToken;

  const {
    rows: items,
    setRows: setItems,
    loading,
    hasMore,
    loadMore,
  } = usePagedList<Notification>(async (cursor) => {
    const page = await getNotifications(token, { cursor });
    return { rows: page.notificationList, nextCursor: page.nextCursor };
  });

  // Opening one greys it here and clears it from the header badge.
  const open = (item: Notification) => {
    if (item.readStatus) return;
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, readStatus: true } : n)));
    markAsRead(item.id);
  };

  if (loading) {
    return (
      <div className="py-8 flex items-center gap-2.5">
        <span
          role="status"
          aria-label="Loading notifications"
          className="inline-block w-3.5 h-3.5 border-[1.5px] border-muted border-t-transparent rounded-full animate-spin"
        />
        <span className="text-xs text-muted">Loading</span>
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted py-8">Nothing yet.</p>;
  }

  return (
    <>
      <ul className="border-t border-border">
        {items.map((item) => (
          <li key={item.id} className="border-b border-border">
            <Link
              href={hrefFor(item)}
              onClick={() => open(item)}
              className={`group flex items-start gap-4 py-4 pl-4 pr-2 -ml-px border-l-2 transition-all duration-300 ease-out hover:bg-bg-subtle hover:border-accent ${
                item.readStatus ? "border-transparent" : "border-accent/30 bg-accent/[0.04]"
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-xs text-muted group-hover:text-accent transition-colors">
                    {TYPE_LABELS[item.type] ?? item.type}
                  </span>
                  <span className="text-xs text-muted shrink-0">
                    {relativeTime(item.dateAndTime)}
                  </span>
                </span>
                <span
                  className={`block text-sm leading-relaxed mt-1.5 ${
                    item.readStatus ? "text-muted" : ""
                  }`}
                >
                  {item.text}
                </span>
              </span>
              <ArrowUpRightIcon
                width={14}
                height={14}
                className="mt-1 shrink-0 text-muted opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-accent transition-all duration-300 ease-out"
              />
            </Link>
          </li>
        ))}
      </ul>

      {hasMore && <LoadMore onClick={loadMore} />}
    </>
  );
};

export default ProfileNotificationsList;
