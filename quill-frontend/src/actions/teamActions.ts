import { PostVisibility } from "@/types/PostProps";
import { getApiErrorMessage } from "@/utils/apiError";
import { API_URL } from "@/utils/constants";
import axios from "axios";

export type Team = {
  id: string;
  name: string;
  isCreator: boolean;
  memberNames: string[];
  sharedWithPost: boolean;
};

export const getTeams = async (token: string, postId?: string): Promise<Team[]> => {
  try {
    const res = await axios.get(`${API_URL}/teams/`, {
      headers: { authorization: token },
      params: postId ? { postId } : undefined,
    });
    return res.data.teams;
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "Couldn't load your teams"));
  }
};

export const createTeam = async (
  name: string,
  memberEmails: string[],
  token: string
): Promise<Team> => {
  try {
    const res = await axios.post(
      `${API_URL}/teams/`,
      { name, memberEmails },
      {
        headers: { authorization: token },
      }
    );
    return res.data.team;
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const missing = (err as any)?.response?.data?.error?.missing;
    if (Array.isArray(missing)) throw new Error(`No Quill account for: ${missing.join(", ")}`);
    throw new Error(getApiErrorMessage(err, "Couldn't create the team"));
  }
};

export const shareToTeams = async (postId: string, teamIds: string[], token: string) => {
  try {
    const res = await axios.put(
      `${API_URL}/blog/${postId}/teams/`,
      { teamIds },
      {
        headers: { authorization: token },
      }
    );
    return res.data as { visibility: PostVisibility; teamIds: string[] };
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "Couldn't update sharing"));
  }
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isCreator: boolean;
  isYou: boolean;
};

export type TeamPost = {
  id: string;
  title: string;
  content: string | null;
  image: string | null;
  publishedDate: string | null;
  visibility: PostVisibility;
  authorId: string;
  author: { id: string; name: string | null };
};

export type TeamOverview = {
  id: string;
  name: string;
  isCreator: boolean;
  members: TeamMember[];
  sharedByYou: TeamPost[];
  sharedWithYou: TeamPost[];
};

export const getTeamOverview = async (token: string): Promise<TeamOverview[]> => {
  try {
    const res = await axios.get(`${API_URL}/teams/overview`, {
      headers: { authorization: token },
    });
    return res.data.teams;
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "Couldn't load your teams"));
  }
};
