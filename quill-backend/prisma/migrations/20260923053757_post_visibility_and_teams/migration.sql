/*
  Warnings:

  - You are about to drop the column `private` on the `Post` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('DRAFT', 'PUBLIC', 'SHARED');

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "private",
ADD COLUMN     "visibility" "PostVisibility" NOT NULL DEFAULT 'DRAFT';


-- Backfill: carry existing published state into visibility
UPDATE "Post"
SET "visibility" = CASE
  WHEN "published" THEN 'PUBLIC'::"PostVisibility"
  ELSE 'DRAFT'::"PostVisibility"
END;

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("teamId","userId")
);

-- CreateTable
CREATE TABLE "PostTeam" (
    "postId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "PostTeam_pkey" PRIMARY KEY ("postId","teamId")
);

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX "PostTeam_teamId_idx" ON "PostTeam"("teamId");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTeam" ADD CONSTRAINT "PostTeam_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTeam" ADD CONSTRAINT "PostTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
