/*
  Warnings:

  - You are about to drop the column `isApproved` on the `Comment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "isApproved",
ADD COLUMN     "commentStatus" "CommentStatus" NOT NULL DEFAULT 'PENDING';
