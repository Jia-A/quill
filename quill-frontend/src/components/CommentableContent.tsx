"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { getOffsets } from "@/utils/commentFunctions";
import ComposePanel from "./annotation/ComposePanel";
import ThreadPanel from "./annotation/ThreadPanel";
import { MiniSpinner, panelStyle, rectOf, useCloseOnScroll, type Anchor } from "./annotation/ui";
import { useComments, useCommentDeepLink } from "./annotation/useComments";
import PostComments from "./PostComments";

type CommentableContentProps = {
  html: string;
  postId: string;
  token?: string;
  postAuthorId?: string;
  currentUserId?: string;
};

type Selection = {
  at: Anchor;
  startOffset: number;
  endOffset: number;
  anchorText: string;
  prefix: string;
  suffix: string;
};

/**
 * Renders post HTML and layers inline annotations over it. Comment data and
 * highlighting live in useComments; the panels are their own components. What
 * remains here is which panel is open and where it sits.
 */
export default function CommentableContent({
  html,
  postId,
  token,
  postAuthorId,
  currentUserId,
}: CommentableContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const { comments, loading, busy, error, setError, add, reply, setStatus } = useComments(
    containerRef,
    postId,
    token,
    currentUserId
  );
  useCommentDeepLink(containerRef, comments);

  // Exactly one of these is ever set: a fresh selection, or an existing thread.
  const [selection, setSelection] = useState<Selection | null>(null);
  const [composing, setComposing] = useState(false);
  const [openThread, setOpenThread] = useState<{ id: string; at: Anchor } | null>(null);
  const [replying, setReplying] = useState(false);

  // An anchored comment is a margin note; one without an anchor belongs to the
  // conversation at the foot of the post.
  const bottomComments = useMemo(() => comments.filter((c) => c.anchorText === null), [comments]);

  const isLoggedIn = Boolean(token);
  const isPostAuthor = Boolean(postAuthorId && currentUserId && postAuthorId === currentUserId);
  const activeComment = comments.find((c) => c.id === openThread?.id);

  const closeCompose = useCallback(() => {
    setSelection(null);
    setComposing(false);
    setError("");
  }, [setError]);

  const closeThread = useCallback(() => {
    setOpenThread(null);
    setReplying(false);
    setError("");
  }, [setError]);

  // Selecting text offers to annotate it; clicking a mark opens its thread.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // The reader selected some text.
    const onMouseUp = () => {
      const selected = getOffsets(container);

      // Nothing selected any more, so put the compose box away.
      if (!selected) {
        closeCompose();
        return;
      }

      setSelection({
        at: rectOf(selected.range),
        startOffset: selected.startOffset,
        endOffset: selected.endOffset,
        anchorText: selected.anchorText,
        prefix: selected.prefix,
        suffix: selected.suffix,
      });
    };

    // The reader clicked an existing highlight.
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const mark = target.closest<HTMLElement>("mark[data-comment-id]");
      if (!mark) return;

      const commentId = mark.dataset.commentId;
      if (!commentId) return;

      const exists = comments.some((c) => c.id === commentId);
      if (!exists) return;

      // Only one panel is ever open, so close the compose box first.
      closeCompose();
      setReplying(false);
      setOpenThread({ id: commentId, at: rectOf(mark) });
    };

    container.addEventListener("mouseup", onMouseUp);
    container.addEventListener("click", onClick);
    return () => {
      container.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("click", onClick);
    };
  }, [comments, closeCompose]);

  // A panel is pinned to a fixed spot on screen, so scrolling would leave it
  // stranded away from its text. Close it instead.
  useCloseOnScroll(closeThread, Boolean(openThread));
  useCloseOnScroll(closeCompose, Boolean(selection));

  // Flag the mark whose thread is open, purely so it can be styled as active.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear the previous one first.
    const previous = container.querySelectorAll<HTMLElement>("mark[data-comment-active]");
    previous.forEach((mark) => delete mark.dataset.commentActive);

    if (!openThread) return;

    const mark = container.querySelector<HTMLElement>(`mark[data-comment-id="${openThread.id}"]`);
    if (mark) mark.dataset.commentActive = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps -- as above
  }, [openThread?.id, comments]);

  // Dismiss on Escape, or a pointer down outside both panels.
  useEffect(() => {
    if (!composing && !openThread) return;

    const closeBoth = () => {
      closeCompose();
      closeThread();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeBoth();
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;

      // Clicks inside either panel are not "outside".
      if (composeRef.current?.contains(target)) return;
      if (threadRef.current?.contains(target)) return;

      // Clicking a highlight opens that thread; closing here would fight it.
      if (target.closest("mark[data-comment-id]")) return;

      closeBoth();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [composing, openThread, closeCompose, closeThread]);

  const handleSave = async (text: string) => {
    if (!text) {
      setError("Comment can't be empty");
      return;
    }
    if (!selection) {
      setError("No text section selected");
      return;
    }

    const saved = await add({
      text,
      postId,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
      anchorText: selection.anchorText,
      prefix: selection.prefix,
      suffix: selection.suffix,
    });

    if (saved) closeCompose();
  };

  const handleReply = async (text: string) => {
    if (!text) {
      setError("Comment can't be empty");
      return;
    }
    if (!openThread) return;

    const sent = await reply(openThread.id, text);
    if (sent) setReplying(false);
  };

  const content = useMemo(
    () => (
      <div
        ref={containerRef}
        className="prose prose-lg dark:prose-invert max-w-none relative"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    ),
    [html]
  );

  return (
    <>
      {content}

      {selection && !composing && (
        <div
          style={{ ...panelStyle(selection.at, 108), width: "auto" }}
          className="z-50 panel rounded-md animate-pop-in"
        >
          <button
            type="button"
            onClick={() => {
              closeThread(); // mutually exclusive with the thread panel
              setComposing(true);
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] hover:text-accent transition-colors duration-200 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <MiniSpinner className="w-[11px] h-[11px]" />
            ) : (
              <ChatBubbleLeftIcon width={11} height={11} />
            )}
            Annotate
          </button>
        </div>
      )}

      {composing && selection && (
        <ComposePanel
          panelRef={composeRef}
          at={selection.at}
          isLoggedIn={isLoggedIn}
          busy={busy}
          error={error}
          onSave={handleSave}
          onClose={closeCompose}
        />
      )}

      {openThread && activeComment && (
        <ThreadPanel
          panelRef={threadRef}
          comment={activeComment}
          at={openThread.at}
          isLoggedIn={isLoggedIn}
          isPostAuthor={isPostAuthor}
          currentUserId={currentUserId}
          busy={busy}
          error={error}
          replying={replying}
          onReplyOpen={() => setReplying(true)}
          onReplyCancel={() => setReplying(false)}
          onReply={handleReply}
          onStatus={async (status) => {
            const changed = await setStatus(openThread.id, status);
            if (changed) closeThread();
          }}
          onClose={closeThread}
        />
      )}

      <PostComments
        comments={bottomComments}
        isLoggedIn={isLoggedIn}
        busy={busy === "comment"}
        error={error}
        onAdd={(text) => add({ text, postId })}
      />
    </>
  );
}
