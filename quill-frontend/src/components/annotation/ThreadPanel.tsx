"use client";

import { useRef } from "react";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import type { Comment } from "@/types/CommentProps";
import {
  AccentButton,
  CloseButton,
  LoginNote,
  META,
  MiniSpinner,
  PanelInput,
  TextButton,
  THREAD_W,
  panelClass,
  panelStyle,
  type Anchor,
} from "./ui";
import type { Busy } from "./useComments";

const Byline = ({
  name,
  authorId,
  currentUserId,
}: {
  name?: string;
  authorId?: string;
  currentUserId?: string;
}) => (
  <span className={`mt-1.5 flex items-center gap-1.5 ${META} text-muted`}>
    <span className="w-3 h-px bg-border" aria-hidden />
    {name ?? "Unknown"}
    {authorId && currentUserId && authorId === currentUserId && (
      <span className="text-accent">(you)</span>
    )}
  </span>
);

/** Approve / Reject. `quiet` gives the outlined, less prominent look. */
const ModerateButton = ({
  label,
  quiet,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  quiet?: boolean;
  loading?: boolean;
}) => {
  const look = quiet
    ? "border border-border text-muted hover:text-fg hover:border-fg/40"
    : "bg-accent text-accent-fg hover:opacity-90";

  return (
    <button
      type="button"
      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded py-1 ${META} ${look} transition-colors duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
      {...props}
    >
      {loading && <MiniSpinner />}
      {label}
    </button>
  );
};

/** An existing annotation: its text, replies, moderation and reply box. */
export default function ThreadPanel({
  comment,
  at,
  isLoggedIn,
  isPostAuthor,
  currentUserId,
  busy,
  error,
  replying,
  onReplyOpen,
  onReplyCancel,
  onReply,
  onStatus,
  onClose,
  panelRef,
}: {
  comment: Comment;
  at: Anchor;
  isLoggedIn: boolean;
  isPostAuthor: boolean;
  currentUserId?: string;
  busy: Busy;
  error: string;
  replying: boolean;
  onReplyOpen: () => void;
  onReplyCancel: () => void;
  onReply: (text: string) => void;
  onStatus: (status: "APPROVED" | "REJECTED") => void;
  onClose: () => void;
  panelRef: React.Ref<HTMLDivElement>;
}) {
  const replyRef = useRef<HTMLInputElement>(null);
  const sending = busy === "reply";
  const isPending = comment.commentStatus === "PENDING";
  const isApproved = comment.commentStatus === "APPROVED";
  const isRejected = comment.commentStatus === "REJECTED";
  const replies = comment.replies ?? [];

  const send = () => {
    const text = replyRef.current?.value.trim() ?? "";
    onReply(text);
  };

  return (
    <div ref={panelRef} style={panelStyle(at, THREAD_W)} className={panelClass}>
      <CloseButton onClick={onClose} aria-label="Close annotation" />

      <div className="px-3 pb-2.5">
        <p className="text-sm leading-snug">{comment.text}</p>
        <Byline
          name={comment.author?.name}
          authorId={comment.authorId}
          currentUserId={currentUserId}
        />
      </div>

      {replies.length > 0 && (
        <ul className="px-3 pb-2 space-y-2.5 max-h-[150px] overflow-y-auto">
          {replies.map((reply) => (
            <li key={reply.id} className="border-l border-border pl-2.5">
              <p className="text-xs leading-snug text-muted">{reply.text}</p>
              <Byline
                name={reply.author?.name}
                authorId={reply.authorId}
                currentUserId={currentUserId}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Only the post author can approve or reject; everyone else is told why. */}
      {isPending && isPostAuthor && (
        <div className="flex gap-2 px-3 py-2 border-t border-border">
          <ModerateButton
            label="Approve"
            loading={busy === "APPROVED"}
            disabled={busy !== null}
            onClick={() => onStatus("APPROVED")}
          />
          <ModerateButton
            label="Reject"
            quiet
            loading={busy === "REJECTED"}
            disabled={busy !== null}
            onClick={() => onStatus("REJECTED")}
          />
        </div>
      )}

      {isPending && !isPostAuthor && (
        <p className="px-3 py-2 border-t border-border text-xs text-muted">
          Awaiting approval from the post author.
        </p>
      )}

      {/* Only its own author ever sees a rejected comment's mark, so this line
          is for them: the decision, stated plainly, with no action left. */}
      {isRejected && (
        <p className="px-3 py-2 border-t border-border text-xs text-muted">
          Rejected by the post author.
        </p>
      )}

      {replying ? (
        <div className="border-t border-border px-3 py-2">
          <PanelInput
            ref={replyRef}
            disabled={sending}
            placeholder="Write a reply…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !busy) send();
              if (e.key === "Escape") onReplyCancel();
            }}
          />
          {error && <p className={`pt-1.5 ${META} text-danger`}>{error}</p>}
          <div className="flex justify-end items-center gap-3 pt-2">
            <TextButton onClick={onReplyCancel}>Cancel</TextButton>
            <AccentButton onClick={send} disabled={sending} loading={sending}>
              {sending ? "Sending" : "Reply"}
            </AccentButton>
          </div>
        </div>
      ) : (
        <>
          {isApproved && isLoggedIn && (
            <button
              type="button"
              onClick={onReplyOpen}
              className={`w-full flex items-center gap-1.5 px-3 py-2 border-t border-border ${META} text-muted hover:text-accent transition-colors duration-200 cursor-pointer`}
            >
              <ArrowUturnLeftIcon width={11} height={11} />
              Reply
            </button>
          )}

          {isApproved && !isLoggedIn && (
            <LoginNote what="reply in inline comments" onNavigate={onClose} />
          )}
        </>
      )}
    </div>
  );
}
