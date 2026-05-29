import { API_URL } from "@/utils/constants";
import axios from "axios";

export type Platform = "linkedin";

export const getDrafts = async (postId: string, token: string) => {
  const response = await axios.get(`${API_URL}/social/${postId}`, {
    headers: { authorization: token },
  });
  return response.data as { linkedin: string | null };
};

export const generateDraft = async (postId: string, platform: Platform, token: string) => {
  const response = await axios.post(
    `${API_URL}/social/${postId}/generate`,
    { platform },
    { headers: { authorization: token } }
  );
  return response.data as { platform: Platform; content: string };
};

export const updateDraft = async (
  postId: string,
  platform: Platform,
  content: string,
  token: string
) => {
  const response = await axios.put(
    `${API_URL}/social/${postId}`,
    { platform, content },
    { headers: { authorization: token } }
  );
  return response.data as { platform: Platform; content: string };
};

export const getLinkedInStatus = async (token: string) => {
  const response = await axios.get(`${API_URL}/linkedin/status`, {
    headers: { authorization: token },
  });
  return response.data as { connected: boolean };
};

export const linkedInConnectUrl = (token: string) =>
  `${API_URL}/linkedin/connect?token=${encodeURIComponent(token)}`;

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
