-- CreateIndex
CREATE INDEX "Comment_postId_parentId_idx" ON "Comment"("postId", "parentId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Notification_userId_dateAndTime_idx" ON "Notification"("userId", "dateAndTime");

-- CreateIndex
CREATE INDEX "Notification_userId_readStatus_dateAndTime_idx" ON "Notification"("userId", "readStatus", "dateAndTime");
