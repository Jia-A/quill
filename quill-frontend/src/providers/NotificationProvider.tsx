"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

interface Notification {
  id: string;
  type: string;
  text: string;
  readStatus: boolean;
  postId: string;
  commentId: string | null;
  dateAndTime: string;
}

interface NotificationContextShape {
  notifications: Notification[];
  unreadCount: number;
  connectionStatus: "connecting" | "connected" | "disconnected";
  refetch: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

export type { Notification };

const NotificationContext = createContext<NotificationContextShape | null>(null);

// CONFIRM these match whatever env var names your actions/*.ts files already use —
// I'm guessing based on convention, not reading your actual env setup.
const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL; // e.g. wss://your-worker.workers.dev

const RECONNECT_BASE_DELAY = 1000; // 1s
const RECONNECT_MAX_DELAY = 30000; // 30s ceiling

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);

  function getReconnectDelay(): number {
    const attempt = reconnectAttemptRef.current;
    const exponential = RECONNECT_BASE_DELAY * Math.pow(2, attempt);
    const capped = Math.min(exponential, RECONNECT_MAX_DELAY);
    const jitter = Math.random() * capped * 0.3; // up to 30% randomness on top
    return capped + jitter;
  }

  const markAsRead = useCallback(
    async (id: string) => {
      if (!session?.backendToken) return;
      try {
        await axios.patch(
          `${API_BASE}/api/v1/notification/${id}`,
          {},
          {
            headers: { Authorization: `${session.backendToken}` },
          }
        );
        // optimistic local update — remove from dropdown, decrement badge
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    },
    [session?.backendToken]
  );

  const fetchNotifications = useCallback(
    async (params?: { unreadOnly?: boolean; take?: number }) => {
      if (!session?.backendToken) return;
      try {
        const data = await axios.get(`${API_BASE}/notification`, {
          headers: { Authorization: `${session.backendToken}` },
          params: { unreadOnly: params?.unreadOnly ?? true, take: params?.take ?? 10 },
        });
        if (!data) throw new Error("Failed to fetch notifications");
        setNotifications(data?.data?.notificationList ?? []);
        setUnreadCount(data?.data?.count ?? 0);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    },
    [session?.backendToken]
  );

  const isMountedRef = useRef(true);

  const connect = useCallback(async () => {
    if (!session?.backendToken) return;

    try {
      setConnectionStatus("connecting");
      console.log("connecting");

      // Step 1: mint a single-use ticket
      const ticketData = await axios.post(
        `${API_BASE}/notification/ticket`,
        {},
        {
          headers: { Authorization: `${session.backendToken}` },
        }
      );
      if (!ticketData) throw new Error("Failed to fetch ticket");
      // CONFIRM the actual field name — your /ticket route does
      // `return c.json(await res.json())` straight from the DO's /generate-ticket response,
      // so I don't actually know what key the ticket lives under. Check it and fix this line.
      const ticket = ticketData?.data?.ticket;

      if (!isMountedRef.current) return;

      // Step 2: open the socket, ticket in the query string
      const ws = new WebSocket(
        `${WS_BASE}/notification/connect?ticket=${ticket}&userId=${session?.user?.id}`
      );
      socketRef.current = ws;

      ws.onopen = () => {
        if (isMountedRef.current) setConnectionStatus("connected");
        console.log("connected");
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const payload = JSON.parse(event.data); // { type, notificationId } — not full content
          // The push is a signal, not data — refetch rather than trying to construct
          // a Notification object from two fields.
          console.log("here");
          fetchNotifications();
        } catch (err) {
          console.error("Failed to parse notification payload:", err);
        }
      };

      ws.onclose = () => {
        socketRef.current = null;
        if (!isMountedRef.current) return; // <-- the actual fix. Unmounted? Stop here, no retry scheduled.
        setConnectionStatus("disconnected");
        console.log("Closed");
        // Ticket is single-use + short-lived — can't reopen the same URL.
        // Re-run the WHOLE sequence (new ticket, new connect), not just retry the socket.
        const delay = getReconnectDelay();
        reconnectAttemptRef.current += 1;
        setTimeout(() => connect(), delay);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };
    } catch (err) {
      if (isMountedRef.current) setConnectionStatus("disconnected");
      console.error("Failed to connect notification socket:", err);
    }
  }, [session?.backendToken, fetchNotifications]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!session?.backendToken) return;

    fetchNotifications();
    connect();

    return () => {
      isMountedRef.current = false;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [session?.backendToken, connect, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        connectionStatus,
        refetch: fetchNotifications,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
