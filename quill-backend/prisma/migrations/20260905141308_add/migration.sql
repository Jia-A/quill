-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "private" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "followersCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "followingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "linkedinProfileUrl" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "newsletterSubscription" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "occupation" TEXT;

-- CreateTable
CREATE TABLE "_SavedPosts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SavedPosts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SavedPosts_B_index" ON "_SavedPosts"("B");

-- AddForeignKey
ALTER TABLE "_SavedPosts" ADD CONSTRAINT "_SavedPosts_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SavedPosts" ADD CONSTRAINT "_SavedPosts_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
