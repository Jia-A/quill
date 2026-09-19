"use client";

import Link from "next/link";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { useNotifications } from "@/providers/NotificationProvider";
import { TYPE_LABELS, relativeTime, hrefFor } from "@/utils/notificationFormat";

// Full-width notification feed for the profile Activity tab. Reads the same
// provider as the header dropdown, so no extra fetch.
const ProfileNotificationsList = () => {
  const { notifications, connectionStatus } = useNotifications();

  const isEmpty = notifications.length === 0;

  if (isEmpty && connectionStatus === "connecting") {
    return (
      <div className="py-8 flex items-center gap-2.5">
        <span
          role="status"
          aria-label="Loading notifications"
          className="inline-block w-3.5 h-3.5 border-[1.5px] border-muted-foreground border-t-transparent rounded-full animate-spin"
        />
        <span className="eyebrow text-[10px]">Loading</span>
      </div>
    );
  }

  if (isEmpty) {
    return <p className="text-sm font-serif italic text-muted-foreground py-8">Nothing yet.</p>;
  }

  return (
    <ul className="border-t border-border">
      {notifications.map((item) => (
        <li key={item.id} className="border-b border-border">
          <Link
            href={hrefFor(item)}
            className={`group flex items-start gap-4 py-4 pl-4 pr-2 -ml-px border-l-2 transition-all duration-300 ease-out hover:bg-muted/50 hover:border-accent ${
              item.readStatus ? "border-transparent" : "border-accent/30 bg-accent/[0.04]"
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className="eyebrow text-[10px] group-hover:accent-text transition-colors">
                  {TYPE_LABELS[item.type] ?? item.type}
                </span>
                <span className="eyebrow text-[10px] shrink-0">
                  {relativeTime(item.dateAndTime)}
                </span>
              </span>
              <span className="block text-sm font-serif leading-relaxed mt-1.5">{item.text}</span>
            </span>
            <ArrowUpRightIcon
              width={14}
              height={14}
              className="mt-1 shrink-0 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-accent transition-all duration-300 ease-out"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default ProfileNotificationsList;
