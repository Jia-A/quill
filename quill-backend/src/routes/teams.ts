import { withAccelerate } from "@prisma/extension-accelerate";
import { Prisma, PrismaClient } from "../generated/prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware";
import { Hono } from "hono";

export const teamRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

const teamSelect = (postId: string) =>
  ({
    id: true,
    name: true,
    creatorId: true,
    members: { select: { user: { select: { name: true } } } },
    posts: { where: { postId }, select: { postId: true } },
  }) satisfies Prisma.TeamSelect;

type TeamRow = Prisma.TeamGetPayload<{ select: ReturnType<typeof teamSelect> }>;

const createdTeamSelect = {
  id: true,
  name: true,
  members: { select: { user: { select: { name: true } } } },
} satisfies Prisma.TeamSelect;

type CreatedTeam = Prisma.TeamGetPayload<{ select: typeof createdTeamSelect }>;

teamRouter.get("/", authMiddleware, async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const userId = c.get("userId") as string;
  const postId = c.req.query("postId");

  try {
    const teams = (await prisma.team.findMany({
      where: { members: { some: { userId } } },
      select: teamSelect(postId ?? ""),
      orderBy: { createdAt: "desc" },
    })) as unknown as TeamRow[];

    return c.json(
      {
        teams: teams.map((t) => ({
          id: t.id,
          name: t.name,
          isCreator: t.creatorId === userId,
          memberNames: t.members.map((m) => m.user.name?.split(" ")[0] ?? "Unknown"),
          sharedWithPost: t.posts.length > 0,
        })),
      },
      200
    );
  } catch (err) {
    console.error("ERROR HAPPENED in GET /teams:", err);
    return c.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Could not load teams" } },
      500
    );
  }
});

teamRouter.post("/", authMiddleware, async (c) => {
  const prisma = new PrismaClient({ accelerateUrl: c.env.DATABASE_URL }).$extends(withAccelerate());
  const userId = c.get("userId") as string;

  try {
    const body = await c.req.json().catch(() => ({}));

    // Name
    if (typeof body.name !== "string" || !body.name.trim())
      return c.json(
        { error: { code: "INVALID_TEAM_NAME", message: "Team name is required." } },
        400
      );
    const name = body.name.trim();
    if (name.length > 50)
      return c.json(
        { error: { code: "INVALID_TEAM_NAME", message: "Team name must be under 50 characters." } },
        400
      );

    // Member emails
    if (
      !Array.isArray(body.memberEmails) ||
      !body.memberEmails.every((e: unknown) => typeof e === "string")
    )
      return c.json(
        { error: { code: "INVALID_MEMBERS", message: "memberEmails must be a list of emails." } },
        400
      );

    const creator = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!creator)
      return c.json({ error: { code: "AUTH_FAILED", message: "Please log in again." } }, 401);

    const emails: string[] = [
      ...new Set((body.memberEmails as string[]).map((e) => e.trim()).filter(Boolean)),
    ].filter((e) => e !== creator.email);

    if (emails.length === 0)
      return c.json(
        { error: { code: "INVALID_MEMBERS", message: "Add at least one other member." } },
        400
      );
    if (emails.length > 30)
      return c.json(
        { error: { code: "INVALID_MEMBERS", message: "A team can have at most 30 members." } },
        400
      );

    // Every email must match a real user, or nothing is created
    const members = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true },
    });
    const found = new Set(members.map((m) => m.email));
    const missing = emails.filter((e) => !found.has(e));
    if (missing.length > 0)
      return c.json(
        {
          error: {
            code: "USERS_NOT_FOUND",
            message: "Some emails don't match a Quill account.",
            missing,
          },
        },
        400
      );

    // Nested create = one transaction: team + every member row, or nothing
    const team = (await prisma.team.create({
      data: {
        name,
        creatorId: userId,
        members: { create: [{ userId }, ...members.map((m) => ({ userId: m.id }))] },
      },
      select: createdTeamSelect,
    })) as unknown as CreatedTeam;

    return c.json(
      {
        team: {
          id: team.id,
          name: team.name,
          isCreator: true,
          memberNames: team.members.map((m) => m.user.name?.split(" ")[0] ?? "Unknown"),
          sharedWithPost: false,
        },
      },
      201
    );
  } catch (err) {
    console.error("ERROR HAPPENED in POST /teams:", err);
    return c.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Could not create team" } },
      500
    );
  }
});

const overviewSelect = {
  id: true,
  name: true,
  creatorId: true,
  createdAt: true,
  members: {
    select: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  },
  posts: {
    select: {
      post: {
        select: {
          id: true,
          title: true,
          content: true,
          image: true,
          publishedDate: true,
          visibility: true,
          authorId: true,
          author: { select: { id: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.TeamSelect;

type OverviewRow = Prisma.TeamGetPayload<{ select: typeof overviewSelect }>;

teamRouter.get("/overview", authMiddleware, async (c) => {
  const prisma = new PrismaClient({ accelerateUrl: c.env.DATABASE_URL }).$extends(withAccelerate());
  const userId = c.get("userId") as string;

  try {
    const teams = (await prisma.team.findMany({
      where: { members: { some: { userId } } },
      select: overviewSelect,
      orderBy: { createdAt: "desc" },
    })) as unknown as OverviewRow[];

    return c.json(
      {
        teams: teams.map((t) => {
          // A post sits in exactly one of these two lists, decided by who wrote
          // it: the page shows "shared by you" and "shared with you" apart.
          const shared = t.posts.map((p) => p.post);
          return {
            id: t.id,
            name: t.name,
            isCreator: t.creatorId === userId,
            members: t.members.map((m) => ({
              id: m.user.id,
              name: m.user.name ?? "Unknown",
              email: m.user.email,
              avatar: m.user.avatar,
              isCreator: m.user.id === t.creatorId,
              isYou: m.user.id === userId,
            })),
            sharedByYou: shared.filter((p) => p.authorId === userId),
            sharedWithYou: shared.filter((p) => p.authorId !== userId),
          };
        }),
      },
      200
    );
  } catch (err) {
    console.error("ERROR HAPPENED in GET /teams/overview:", err);
    return c.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Could not load teams" } },
      500
    );
  }
});
