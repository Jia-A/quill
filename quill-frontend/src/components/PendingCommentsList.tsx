"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { getPendingComments } from "@/actions/commentAction";
import { usePagedList } from "@/utils/usePagedList";
import type { Comment } from "@/types/CommentProps";
import LoadMore from "./LoadMore";

// How each status reads in the corner of a row.
const STATUS = {
  PENDING: { label: "Pending", colour: "text-muted-foreground" },
  APPROVED: { label: "Approved", colour: "accent-text" },
  REJECTED: { label: "Rejected", colour: "text-destructive" },
};

// Comment list for the profile Activity tabs. The comment text leads; the post
// it belongs to is the subordinate line beneath it.
//
// `status` turns on paging: the moderation tabs pass it, the "your comments"
// tab doesn't and just shows what it was given.
const PendingCommentsList = ({
  comments = [],
  showStatus = true,
  showPostAuthor = true,
  status,
  nextCursor = null,
}: {
  comments?: Comment[];
  showStatus?: boolean;
  showPostAuthor?: boolean;
  status?: "PENDING" | "REJECTED";
  nextCursor?: string | null;
}) => {
  const { data: session } = useSession();

  const { rows, hasMore, loadMore } = usePagedList(
    async (cursor) => {
      const page = await getPendingComments(session?.backendToken, status, { cursor });
      return { rows: page.comments as Comment[], nextCursor: page.nextCursor };
    },
    { rows: comments, nextCursor }
  );

  if (rows.length === 0) {
    return <p className="py-2 text-xl font-serif text-muted-foreground">Nothing here.</p>;
  }

  return (
    <>
      <ul className="border-t border-border">
        {rows.map((comment) => {
          const postAuthor = showPostAuthor ? comment.post?.author?.name : undefined;
          const rowStatus = STATUS[comment.commentStatus];

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

                {showStatus && rowStatus && (
                  <span
                    className={`shrink-0 font-mono text-[11px] tracking-[0.12em] ${rowStatus.colour}`}
                  >
                    {rowStatus.label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {hasMore && <LoadMore onClick={loadMore} />}
    </>
  );
};

export default PendingCommentsList;
