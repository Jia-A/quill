"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getComments, patchCommentStatus, postComments } from "@/actions/commentAction";
import type { Comment } from "@/types/CommentProps";
import {
  MAX_COMMENT_LENGTH,
  clearHighlights,
  getPlainText,
  highlightRange,
  resolveAnchor,
} from "@/utils/commentFunctions";

/** What async action is in flight, so a spinner shows only on its own control. */
export type Busy = null | "comment" | "reply" | "APPROVED" | "REJECTED";

/**
 * Owns the comments for a post: loading them, painting the highlights into the
 * article, the ?comment= deep link, and the three mutations. The component that
 * uses this deals only with panels and positioning.
 */
export function useComments(
  containerRef: React.RefObject<HTMLDivElement | null>,
  postId: string,
  token?: string,
  currentUserId?: string
) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getComments(postId, token);
        setComments(data.comments);
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [postId, token]);

  // Repaint <mark> highlights whenever the comments change.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    clearHighlights(container);
    const postText = getPlainText(container);

    for (const comment of comments) {
      // Replies have no passage of their own to highlight.
      if (comment.startOffset === null) continue;

      // The post may have been edited, so find where the passage sits now.
      const position = resolveAnchor(postText, comment);
      if (!position) continue;

      const isMine = Boolean(currentUserId && comment.authorId === currentUserId);

      highlightRange(
        container,
        position.start,
        position.end,
        comment.id,
        comment.commentStatus,
        isMine
      );
    }
  }, [comments, currentUserId, containerRef]);

  const add = useCallback(
    async (payload: Parameters<typeof postComments>[0]) => {
      if (payload.text.length > MAX_COMMENT_LENGTH) {
        setError(`Comment must be ${MAX_COMMENT_LENGTH} characters or fewer`);
        return false;
      }
      setBusy("comment");
      try {
        const res = await postComments(payload, token);
        if (res?.comment) setComments((prev) => [...prev, res.comment]);
        setError("");
        return true;
      } catch (err) {
        console.error("Error in posting comments", err);
        setError("Failed to post a comment");
        return false;
      } finally {
        setBusy(null);
      }
    },
    [token]
  );

  const reply = useCallback(
    async (parentId: string, text: string) => {
      if (text.length > MAX_COMMENT_LENGTH) {
        setError(`Comment must be ${MAX_COMMENT_LENGTH} characters or fewer`);
        return false;
      }
      setBusy("reply");
      try {
        const res = await postComments({ text, postId, parentId }, token);
        const created = res?.comment;
        if (created) {
          // Attach the new reply to the comment it answers.
          setComments((current) =>
            current.map((comment) => {
              if (comment.id !== created.parentId) return comment;
              const replies = comment.replies ?? [];
              return { ...comment, replies: [...replies, created] };
            })
          );
        }
        setError("");
        return true;
      } catch (err) {
        console.error("Error in posting comments", err);
        setError("Failed to post a comment");
        return false;
      } finally {
        setBusy(null);
      }
    },
    [postId, token]
  );

  const setStatus = useCallback(
    async (id: string, status: "APPROVED" | "REJECTED") => {
      setBusy(status);
      try {
        const res = await patchCommentStatus(id, status, token);
        const updated = res?.data?.response;
        if (updated) setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        return Boolean(updated);
      } catch (err) {
        console.error(err);
        return false;
      } finally {
        setBusy(null);
      }
    },
    [token]
  );

  return { comments, loading, busy, error, setError, add, reply, setStatus };
}

/**
 * Scrolls to the comment named by ?comment= once highlights are painted, and
 * pulses its passage. Read from the router's search params rather than a
 * one-time window.location read: two notifications for the same post are a
 * client-side navigation that does not remount this component, so a value
 * captured at mount would stay stuck on the first comment.
 */
export function useCommentDeepLink(
  containerRef: React.RefObject<HTMLDivElement | null>,
  comments: Comment[]
) {
  const id = useSearchParams().get("comment");
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!id || handled.current === id || comments.length === 0) return;

    // The id may name a top-level comment or a reply. Replies carry no anchor,
    // so either way scroll to the comment that owns the highlighted passage.
    const owner = comments.find((comment) => {
      if (comment.id === id) return true;
      return comment.replies?.some((reply) => reply.id === id);
    });
    if (!owner) return;

    const mark = containerRef.current?.querySelector<HTMLElement>(
      `mark[data-comment-id="${owner.id}"]`
    );
    // No mark yet, or none at all because the post was edited past the anchor.
    // Leave `handled` unset so a later repaint gets another chance.
    if (!mark) return;

    handled.current = id;
    mark.scrollIntoView({ behavior: "smooth", block: "center" });
    mark.dataset.commentFound = ""; // pulses via the comment-found animation
    const timer = window.setTimeout(() => delete mark.dataset.commentFound, 2200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [id, comments, containerRef]);
}
