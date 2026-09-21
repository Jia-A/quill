import type { Notification } from "@/providers/NotificationProvider";

// Mono label kicker per notification kind — mirrors the NotificationType enum.
export const TYPE_LABELS: Record<string, string> = {
  COMMENT_RECEIVED: "New comment",
  REPLY_RECEIVED: "New reply",
  COMMENT_APPROVED: "Approved",
  COMMENT_REJECTED: "Rejected",
};

const MINUTE = 60 * 1000;
const HOUR = 60; // in minutes
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** "just now", "5m ago", "3h ago", "2d ago", then a date once it's over a week. */
export const relativeTime = (iso: string) => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const minutesAgo = Math.round((Date.now() - then) / MINUTE);

  if (minutesAgo < 1) return "just now";
  if (minutesAgo < HOUR) return `${minutesAgo}m ago`;
  if (minutesAgo < DAY) return `${Math.round(minutesAgo / HOUR)}h ago`;
  if (minutesAgo < WEEK) return `${Math.round(minutesAgo / DAY)}d ago`;

  return new Date(then).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

// Deep-links to the comment via a query param, not a #hash: the target <mark>
// is created at runtime once comments load, so a hash has nothing to find.
export const hrefFor = (notification: Notification) => {
  const { postId, commentId } = notification;
  if (commentId) return `/blog/${postId}?comment=${commentId}`;
  return `/blog/${postId}`;
};
