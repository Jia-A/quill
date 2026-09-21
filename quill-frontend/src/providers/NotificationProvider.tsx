"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { API_URL, WS_API_URL } from "@/utils/constants";

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
      const current = notifications.find((n) => n.id === id);
      if (!current || current.readStatus) return;
      // optimistic local update — remove from dropdown, decrement badge
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readStatus: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await axios.patch(
          `${API_URL}/notification/${id}`,
          {},
          {
            headers: { Authorization: `${session.backendToken}` },
          }
        );
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    },
    [session?.backendToken, notifications]
  );

  const fetchNotifications = useCallback(
    async (params?: { unreadOnly?: boolean; take?: number }) => {
      if (!session?.backendToken) return;
      try {
        const data = await axios.get(`${API_URL}/notification`, {
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
  const reconnectTimerRef = useRef<number | null>(null);

  const connect = useCallback(async () => {
    if (!session?.backendToken) return;
    if (!isMountedRef.current) return;

    try {
      setConnectionStatus("connecting");

      // Step 1: mint a single-use ticket
      const ticketData = await axios.post(
        `${API_URL}/notification/ticket`,
        {},
        {
          headers: { Authorization: `${session.backendToken}` },
        }
      );
      if (!ticketData) throw new Error("Failed to fetch ticket");
      const ticket = ticketData?.data?.ticket;

      if (!isMountedRef.current) return;

      // Step 2: open the socket, ticket in the query string
      const ws = new WebSocket(
        `${WS_API_URL}/notification/connect?ticket=${ticket}&userId=${session?.user?.id}`
      );
      socketRef.current = ws;

      ws.onopen = () => {
        if (isMountedRef.current) setConnectionStatus("connected");
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          JSON.parse(event.data); // { type, notificationId } — not full content
          // The push is a signal, not data — refetch rather than trying to construct
          // a Notification object from two fields.
          fetchNotifications();
        } catch (err) {
          console.error("Failed to parse notification payload:", err);
        }
      };

      ws.onclose = () => {
        socketRef.current = null;
        if (!isMountedRef.current) return; // <-- the actual fix. Unmounted? Stop here, no retry scheduled.
        setConnectionStatus("disconnected");
        // Ticket is single-use + short-lived — can't reopen the same URL.
        // Re-run the WHOLE sequence (new ticket, new connect), not just retry the socket.
        const delay = getReconnectDelay();
        reconnectAttemptRef.current += 1;
        reconnectTimerRef.current = window.setTimeout(() => connect(), delay);
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
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
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
