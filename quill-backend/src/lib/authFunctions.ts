import { verify } from "hono/jwt";
import { DB } from "./prisma";

type ReadablePost = {
  id: string;
  authorId: string;
  visibility: "PUBLIC" | "SHARED" | "DRAFT";
};

export const canReadPost = async (
  prisma: DB,
  post: ReadablePost,
  requesterId: string | undefined
): Promise<boolean> => {
  if (post.visibility === "PUBLIC") return true;
  if (!requesterId) return false;
  if (post.authorId === requesterId) return true;
  if (post.visibility === "SHARED") {
    const viaTeam = await prisma.postTeam.findFirst({
      where: { postId: post.id, team: { members: { some: { userId: requesterId } } } },
      select: { postId: true },
    });
    return viaTeam !== null;
  }
  return false; // fail closed: anything not explicitly allowed is denied
};

export const getOptionalUserId = async (
  authHeader: string | undefined,
  secret: string
): Promise<string | undefined> => {
  if (!authHeader) return undefined;
  try {
    const payload = await verify(authHeader, secret, "HS256");
    return typeof payload?.id === "string" ? payload.id : undefined;
  } catch {
    return undefined;
  }
};
