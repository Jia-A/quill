import { API_URL } from "@/utils/constants";
import type { Notification } from "@/providers/NotificationProvider";

export type NotificationPage = {
  notificationList: Notification[];
  count: number;
  // Pass back as `cursor` for the next page. Null means there isn't one.
  nextCursor: string | null;
};

export const getNotifications = async (
  token?: string,
  options?: { unreadOnly?: boolean; take?: number; cursor?: string }
): Promise<NotificationPage> => {
  const params = new URLSearchParams();
  if (options?.unreadOnly) params.set("unreadOnly", "true");
  if (options?.take) params.set("take", String(options.take));
  if (options?.cursor) params.set("cursor", options.cursor);

  const response = await fetch(`${API_URL}/notification?${params}`, {
    headers: token ? { authorization: token } : undefined,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.status}`);
  }
  return response.json();
};
