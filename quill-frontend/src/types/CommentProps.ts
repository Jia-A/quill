export type Comment = {
  text: string;
  id: string;
  postId: string;
  authorId: string;
  // Only the profile endpoints include the parent post; GET /comment/:postId
  // does not, so this is optional.
  post?: { title: string; author?: { name: string } };
  createdAt: Date;
  commentStatus: CommentStatus;
  parentId: string | null;
  startOffset: number | null;
  endOffset: number | null;
  anchorText: string | null;
  prefix: string | null;
  suffix: string | null;
  author: {
    name: string;
    id: string;
    email: string;
  };
  replies?: Comment[];
  // Present on profile rows that are replies — the comment this one answers.
  parent?: {
    id: string;
    text: string;
    anchorText: string | null;
    author?: { name: string };
  } | null;
};

type CommentStatus = "APPROVED" | "PENDING" | "REJECTED";
