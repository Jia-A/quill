export type Comment = {
  text: string;
  id: string;
  postId: string;
  authorId: string;
  createdAt: Date;
  commentStatus: CommentStatus;
  parentId: string | null;
  startOffset: number | null;
  endOffset: number | null;
  anchorText: string | null;
  author: {
    name: string;
    id: string;
    email: string;
  };
  replies?: Comment[];
};

type CommentStatus = "APPROVED" | "PENDING" | "REJECTED";
