import { API_URL } from "@/utils/constants";
import axios from "axios";

export type Platform = "linkedin";

export const getDrafts = async (postId: string, token: string) => {
  try {
    const response = await axios.get(`${API_URL}/social/${postId}`, {
      headers: { authorization: token },
    });
    return response.data as { linkedin: string | null };
  } catch (err) {
    console.error("Error fetching drafts:", err);
    throw new Error("Error fetching drafts");
  }
};

// Pulls the text out of one SSE event's data payload. Workers AI sends both
// `choices[0].delta.content` and `response`; `response` drops spaces and
// quotes, so it is only a fallback for payloads without `choices`. Empty
// choices (the final usage-only event) yield "".
const deltaText = (data: string): string => {
  let parsed: { choices?: { delta?: { content?: string } }[]; response?: string };
  try {
    parsed = JSON.parse(data);
  } catch {
    return "";
  }
  if (Array.isArray(parsed.choices)) return parsed.choices[0]?.delta?.content ?? "";
  return typeof parsed.response === "string" ? parsed.response : "";
};

// Joins an event's `data:` lines; null when the event has none (e.g. comments).
const eventData = (event: string): string | null => {
  const lines = event
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).replace(/^ /, ""));
  return lines.length ? lines.join("\n") : null;
};

// Streams a generated draft, calling onText with each text delta. Resolves on
// `data: [DONE]`; rejects if the stream closes without it. Aborting `signal`
// rejects with an AbortError.
export const streamDraft = async (
  postId: string,
  platform: Platform,
  token: string,
  signal: AbortSignal,
  onText: (text: string) => void
): Promise<void> => {
  const response = await fetch(`${API_URL}/social/${postId}/generate`, {
    method: "POST",
    headers: { authorization: token, "Content-Type": "application/json" },
    body: JSON.stringify({ platform }),
    signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(`Error generating draft: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // A read can hold several events or end mid-event: keep the unfinished tail.
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? "";
    for (const event of events) {
      const data = eventData(event);
      if (data === null) continue;
      if (data === "[DONE]") return;
      const text = deltaText(data);
      if (text) onText(text);
    }
  }
  throw new Error("Draft stream ended before [DONE]");
};

export const updateDraft = async (
  postId: string,
  platform: Platform,
  content: string,
  token: string
) => {
  try {
    const response = await axios.put(
      `${API_URL}/social/${postId}`,
      { platform, content },
      { headers: { authorization: token } }
    );
    return response.data as { platform: Platform; content: string };
  } catch (err) {
    console.error("Error updating draft:", err);
    throw new Error("Error updating draft");
  }
};

export const getLinkedInStatus = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/linkedin/status`, {
      headers: { authorization: token },
    });
    return response.data as { connected: boolean };
  } catch (err) {
    console.error("Error fetching LinkedIn status:", err);
    throw new Error("Error fetching LinkedIn status");
  }
};

export const linkedInConnectUrl = async (token: string, postId?: string) => {
  const response = await axios.get(
    `${API_URL}/linkedin/connect` + (postId ? `?postId=${postId}` : ""),
    {
      headers: { authorization: token },
    }
  );
  return response.data;
};

export type PublishResult =
  | { ok: true; permalink: string | null; shareUrn?: string }
  | { ok: false; reason: "not_connected" | "no_draft" | "failed" };

export const publishToLinkedIn = async (postId: string, token: string): Promise<PublishResult> => {
  try {
    const response = await axios.post(
      `${API_URL}/social/${postId}/publish`,
      {},
      { headers: { authorization: token } }
    );
    return {
      ok: true,
      permalink: response.data.permalink ?? null,
      shareUrn: response.data.shareUrn,
    };
  } catch (err) {
    const e = err as { response?: { status?: number; data?: { error?: string } } };
    const status = e.response?.status;
    if (status === 412) return { ok: false, reason: "not_connected" };
    if (status === 400) return { ok: false, reason: "no_draft" };
    return { ok: false, reason: "failed" };
  }
};
