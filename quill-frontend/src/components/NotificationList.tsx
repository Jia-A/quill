"use client";

import { BellIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";
import { useNotifications, type Notification } from "@/providers/NotificationProvider";

// Mono eyebrow kicker per notification kind — mirrors the NotificationType enum.
const TYPE_LABELS: Record<string, string> = {
  COMMENT_RECEIVED: "New comment",
  REPLY_RECEIVED: "New reply",
  COMMENT_APPROVED: "Approved",
  COMMENT_REJECTED: "Rejected",
};

// "3h ago" / "2d ago" — meta line under each item.
const relativeTime = (iso: string) => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

// A comment notification deep-links to the comment; everything else to the post.
const hrefFor = (n: Notification) =>
  n.commentId ? `/blog/${n.postId}#comment-${n.commentId}` : `/blog/${n.postId}`;

const NotificationList = () => {
  const { notifications, unreadCount, connectionStatus, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="relative w-7 h-7 inline-flex items-center justify-center text-foreground hover:text-accent transition-colors duration-300 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        <BellIcon width={18} height={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 flex items-center justify-center bg-accent text-accent-foreground font-mono text-[9px] leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Tap/click-outside backdrop — works on touch where onMouseLeave never fires */}
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute w-[320px] max-w-[calc(100vw-2.5rem)] bg-popover border border-border top-[58px] right-6 md:right-10 shadow-xl text-popover-foreground z-50">
            <div className="flex items-baseline justify-between px-4 py-3 border-b border-border">
              <span className="eyebrow">Notifications</span>
              <span
                className={`eyebrow text-[10px] ${
                  connectionStatus === "connected" ? "accent-text" : ""
                }`}
              >
                {connectionStatus}
              </span>
            </div>

            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm font-serif text-muted-foreground">
                Nothing new. Go write something.
              </p>
            ) : (
              <ul className="max-h-[360px] overflow-y-auto">
                {notifications.map((n) => (
                  <li key={n.id} className="border-b border-border last:border-b-0">
                    <Link
                      href={hrefFor(n)}
                      onClick={() => {
                        setOpen(false);
                        // markAsRead(n.id);
                      }}
                      className="group flex gap-3 px-4 py-3 hover:bg-muted transition-colors duration-300 ease-out"
                    >
                      <span
                        aria-hidden
                        className={`mt-1.5 w-1.5 h-1.5 shrink-0 ${
                          n.readStatus ? "bg-transparent" : "bg-accent"
                        }`}
                      />
                      <span className="min-w-0">
                        <span className="eyebrow block text-[10px] group-hover:accent-text">
                          {TYPE_LABELS[n.type] ?? n.type}
                        </span>
                        <span className="block text-sm font-serif mt-1 line-clamp-2">{n.text}</span>
                        <span className="eyebrow block text-[10px] mt-1">
                          {relativeTime(n.dateAndTime)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationList;
