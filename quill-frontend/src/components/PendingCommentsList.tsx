import Link from "next/link";
import type { Comment } from "@/types/CommentProps";

// How each status reads in the corner of a row.
const STATUS = {
  PENDING: { label: "Pending", colour: "text-muted-foreground" },
  APPROVED: { label: "Approved", colour: "accent-text" },
  REJECTED: { label: "Rejected", colour: "text-destructive" },
};

// Comment list for the profile Activity tabs. The comment text leads; the post
// it belongs to is the subordinate line beneath it.
const PendingCommentsList = ({
  comments,
  showStatus = true,
  showPostAuthor = true,
}: {
  comments?: Comment[];
  showStatus?: boolean;
  showPostAuthor?: boolean;
}) => {
  if (!comments || comments.length === 0) {
    return <p className="py-2 text-xl font-serif text-muted-foreground">Nothing here.</p>;
  }

  return (
    <ul className="border-t border-border">
      {comments.map((comment) => {
        const postAuthor = showPostAuthor ? comment.post?.author?.name : undefined;
        const status = STATUS[comment.commentStatus];

        return (
          <li key={comment.id} className="border-b border-border">
            <Link
              href={`/blog/${comment.postId}?comment=${comment.id}`}
              className="group flex items-baseline justify-between gap-4 -ml-px border-l-2 border-transparent py-4 pl-4 pr-2 transition-all duration-300 ease-out hover:border-accent hover:bg-muted/50"
            >
              <span className="min-w-0">
                <span className="block font-serif text-[18px] leading-snug line-clamp-2 accent-text transition-colors">
                  {comment.text}
                </span>
                <span className="mt-1.5 block font-mono text-[12px] tracking-[0.12em] text-muted-foreground truncate">
                  <span className="group-hover:text-foreground transition-colors font-semibold">
                    {comment.post?.title ?? "Untitled"}
                  </span>
                  {postAuthor && <span className="text-muted-foreground"> — {postAuthor}</span>}
                </span>
              </span>

              {showStatus && status && (
                <span
                  className={`shrink-0 font-mono text-[11px] tracking-[0.12em] ${status.colour}`}
                >
                  {status.label}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default PendingCommentsList;
