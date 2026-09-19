"use client";

import { BellIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/providers/NotificationProvider";
import { TYPE_LABELS, relativeTime, hrefFor } from "@/utils/notificationFormat";

// The small dot showing whether live updates are working.
const DOT_COLOURS: Record<string, string> = {
  connected: "bg-accent",
  connecting: "bg-muted-foreground animate-pulse",
  disconnected: "bg-border",
};

const NotificationList = () => {
  const { notifications, unreadCount, connectionStatus, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isEmpty = notifications.length === 0;
  const stillConnecting = isEmpty && connectionStatus === "connecting";

  // A full-screen backdrop element cannot work here: the header sets
  // backdrop-blur and a z-index, which creates a stacking context, so any
  // child's z-index is confined to the header's own box and never covers the
  // page below it. A document listener is independent of paint order.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return; // the button toggles itself
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="flex items-center">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`relative w-7 h-7 inline-flex items-center justify-center transition-colors duration-300 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
          open ? "text-accent" : "text-foreground hover:text-accent"
        }`}
      >
        <BellIcon width={24} height={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center bg-accent text-black font-bold font-mono text-[10px] leading-none animate-ember rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute w-[340px] max-w-[calc(100vw-2.5rem)] panel panel-accent top-[58px] right-6 md:right-10 z-[70] animate-pop-in"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="eyebrow">
              Notifications
              {unreadCount > 0 && <span className="accent-text ml-2">{unreadCount} new</span>}
            </span>
            {/* Connection state as a quiet dot — the word "disconnected" was shouting */}
            <span className="flex items-center gap-1.5" title={`Live updates: ${connectionStatus}`}>
              <span
                aria-hidden
                className={`w-1.5 h-1.5 rounded-full ${DOT_COLOURS[connectionStatus]}`}
              />
              <span className="sr-only">{connectionStatus}</span>
            </span>
          </div>

          {stillConnecting ? (
            <div className="px-4 py-10 flex flex-col items-center gap-2.5">
              <span
                role="status"
                aria-label="Loading notifications"
                className="inline-block w-3.5 h-3.5 border-[1.5px] border-muted-foreground border-t-transparent rounded-full animate-spin"
              />
              <p className="eyebrow text-[10px]">Loading</p>
            </div>
          ) : isEmpty ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-serif italic text-muted-foreground">Nothing new.</p>
              <p className="eyebrow text-[10px] mt-2">Go write something</p>
            </div>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto">
              {notifications.map((item) => (
                <li key={item.id} className="border-b border-border last:border-b-0">
                  <Link
                    href={hrefFor(item)}
                    onClick={() => {
                      setOpen(false);
                      // markAsRead(item.id);
                    }}
                    className={`group flex gap-3 px-4 py-3 border-l-2 transition-all duration-300 ease-out hover:bg-muted/60 hover:border-accent ${
                      item.readStatus ? "border-transparent" : "border-accent/30 bg-accent/[0.04]"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-[7px] w-1.5 h-1.5 shrink-0 ${
                        item.readStatus ? "bg-transparent" : "bg-accent"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="eyebrow text-[10px] group-hover:accent-text transition-colors">
                          {TYPE_LABELS[item.type] ?? item.type}
                        </span>
                        <span className="eyebrow text-[10px] shrink-0">
                          {relativeTime(item.dateAndTime)}
                        </span>
                      </span>
                      <span className="block text-sm font-serif leading-relaxed mt-1.5 line-clamp-2">
                        {item.text}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationList;
