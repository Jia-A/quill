import { PrismaClient } from "../generated/prisma/client";

export const getPrisma = (url: string) => new PrismaClient({ accelerateUrl: url });
export type DB = ReturnType<typeof getPrisma>;
