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

export const generateDraft = async (postId: string, platform: Platform, token: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/social/${postId}/generate`,
      { platform },
      { headers: { authorization: token } }
    );
    return response.data as { platform: Platform; content: string };
  } catch (err) {
    console.error("Error generating draft:", err);
    throw new Error("Error generating draft");
  }
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

export const linkedInConnectUrl = (token: string, postId?: string) =>
  `${API_URL}/linkedin/connect?token=${encodeURIComponent(token)}` +
  (postId ? `&postId=${encodeURIComponent(postId)}` : "");

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
