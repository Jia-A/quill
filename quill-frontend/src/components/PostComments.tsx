"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "@/atoms/Avatar";
import { MAX_COMMENT_LENGTH } from "@/utils/commentFunctions";
import { formatDate } from "@/utils/postMeta";
import type { Comment } from "@/types/CommentProps";

type PostCommentsProps = {
  comments: Comment[];
  isLoggedIn: boolean;
  busy: boolean;
  error: string;
  onAdd: (text: string) => Promise<boolean>;
};

/**
 * The conversation at the foot of a post. These are plain comments, not
 * margin notes: they go up as soon as they're written, so there is no
 * pending state to show here.
 */
const PostComments = ({ comments, isLoggedIn, busy, error, onAdd }: PostCommentsProps) => {
  const [text, setText] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const sent = await onAdd(trimmed);
    if (sent) setText("");
  };

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="text-sm font-semibold">
        {comments.length} {comments.length === 1 ? "comment" : "comments"}
      </h2>

      {isLoggedIn ? (
        <form onSubmit={submit} className="mt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            rows={3}
            placeholder="Add a comment"
            aria-label="Add a comment"
            className="w-full resize-none rounded-md border border-border bg-bg p-3 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted">{MAX_COMMENT_LENGTH - text.length} left</span>
            <button
              type="submit"
              disabled={busy || !text.trim()}
              className="rounded-md border border-fg bg-fg px-3 py-1.5 text-sm text-bg hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Posting" : "Comment"}
            </button>
          </div>
          {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted">
          <Link href="/auth/signin" className="text-accent hover:underline">
            Sign in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      {comments.length > 0 && (
        <ul className="mt-8 space-y-6">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <Avatar
                size="sm"
                name={comment.author?.name}
                alt={comment.author?.name || "Reader"}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{comment.author?.name || "Anonymous"}</p>
                <p className="text-xs text-muted">
                  {formatDate(comment.createdAt as unknown as string)}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed">{comment.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default PostComments;
