"use client";
import { getComments, patchCommentStatus, postComments } from "@/actions/commentAction";
import Button from "@/atoms/Button";
import Input from "@/atoms/Input";
import { Comment } from "@/types/CommentProps";
import {
  clearHighlights,
  getPlainText,
  resolveAnchor,
  highlightRange,
  getOffsets,
} from "@/utils/commentFunctions";
import { useEffect, useMemo, useRef, useState } from "react";

type CommentableContentProps = {
  html: string;
  postId: string;
  token?: string;
};

type SelectionRefProps = {
  startOffset: number;
  endOffset: number;
  anchorText: string;
};

const CLOSED = { id: "", state: false, text: "", position: { top: 0, left: 0 }, status: "" };
export default function CommentableContent({ html, postId, token }: CommentableContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<SelectionRefProps>(null);
  const [popupOpen, setPopupOpen] = useState({ visible: false, top: 0, right: 0 });
  const [comments, setComments] = useState<Comment[]>([]);
  const [inputField, setInputField] = useState(false);
  const [commentError, setCommentError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [commentPopup, setCommentPopup] = useState(CLOSED);
  const [repliedToId, setRepliedToId] = useState<string | null>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getComments(postId, token)
      .then((data) => setComments(data.comments))
      .catch((err) => console.error("Failed to load comments:", err));
  }, [postId, token]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    clearHighlights(container);

    const postText = getPlainText(container);

    for (const comment of comments) {
      if (comment.startOffset === null) continue;
      const resolved = resolveAnchor(postText, comment);
      if (!resolved) continue;
      highlightRange(container, resolved.start, resolved.end, comment.id, comment.commentStatus);
    }
  }, [comments]);

  const handlePopup = () => {
    const result = getOffsets(containerRef.current);
    if (!result) {
      closePopup();
      return;
    }
    const { startOffset, endOffset, range, anchorText } = result;
    if (startOffset === null || endOffset === null) return null;
    selectionRef.current = { startOffset, endOffset, anchorText };
    const rect = range.getBoundingClientRect();
    setPopupOpen({ visible: true, top: rect.top, right: rect.right });
  };

  const handleCommentClick = (e: MouseEvent) => {
    const mark = (e.target as HTMLElement).closest<HTMLElement>("mark[data-comment-id]");
    if (!mark) return;
    const id = mark.dataset.commentId;
    if (!id) return;
    const rect = mark.getBoundingClientRect();

    const comment = comments.find((comment) => comment.id === id);

    if (!comment) return;
    setPopupOpen({ visible: false, top: 0, right: 0 });
    setRepliedToId(null); // opening a different comment must not inherit a stale reply-open state
    setCommentPopup({
      text: comment.text,
      id: id,
      state: true,
      position: { top: rect.top + window.scrollY - 20, left: rect.left },
      status: comment.commentStatus,
    });
  };
  useEffect(() => {
    if (!commentPopup.state) return;
    const mark = containerRef.current?.querySelector(`mark[data-comment-id="${commentPopup.id}"]`);
    if (!mark) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setCommentPopup(CLOSED);
          setRepliedToId(null);
        }
      },
      { threshold: 0 }
    );
    observer.observe(mark);
    return () => observer.disconnect();
  }, [commentPopup.state, commentPopup.id]);

  useEffect(() => {
    if (!commentPopup.state) return;
    const close = () => {
      setCommentPopup(CLOSED);
      setRepliedToId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [commentPopup.state]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("mouseup", handlePopup);
    container.addEventListener("click", handleCommentClick);

    return () => {
      container.removeEventListener("mouseup", handlePopup);
      container.removeEventListener("click", handleCommentClick);
    };
  }, [comments]);

  const closePopup = () => {
    setPopupOpen({ visible: false, top: 0, right: 0 });
    setInputField(false);
    setCommentError("");
    selectionRef.current = null;
  };

  const handleSave = async () => {
    let comment;
    if (inputRef.current && inputRef.current.value) {
      comment = inputRef.current.value.trim();
    }
    if (!comment) {
      setCommentError("Comment can't be empty");
      return;
    }
    if (!selectionRef.current) {
      setCommentError("No text section selected");
      return;
    }
    const payload = {
      text: comment,
      postId: postId,
      startOffset: selectionRef.current.startOffset,
      endOffset: selectionRef.current.endOffset,
      anchorText: selectionRef.current.anchorText,
    };
    try {
      const response = await postComments(payload, token);
      if (response && response.comment) {
        setComments((prev) => [...prev, response?.comment]);
      }
      closePopup();
    } catch (err) {
      console.error("Error in posting comments", err);
      setCommentError("Failed to post a comment");
    }
  };

  const handleReplySave = async (id: string) => {
    let comment;
    if (replyInputRef.current && replyInputRef.current.value) {
      comment = replyInputRef.current.value.trim();
    }
    if (!comment) {
      setCommentError("Comment can't be empty");
      return;
    }
    if (!id) {
      setCommentError("No parent comment exists");
      return; // was missing — this previously fell through to the API call anyway
    }
    const payload = {
      text: comment,
      postId: postId,
      parentId: id,
    };
    try {
      const res = await postComments(payload, token); // { message, comment }
      const newReply = res?.comment;
      if (newReply) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === newReply.parentId ? { ...c, replies: [...(c.replies ?? []), newReply] } : c
          )
        );
      }
      setCommentError("");
      setRepliedToId(null); // closes the reply box specifically — closePopup() was the wrong call here
      if (replyInputRef.current) replyInputRef.current.value = "";
    } catch (err) {
      console.error("Error in posting comments", err);
      setCommentError("Failed to post a comment");
    }
  };

  const handleCommentStatus = async (id: string, status: string) => {
    try {
      const res = await patchCommentStatus(id, status, token);
      const updated = res?.data?.response; // check the actual shape
      if (!updated) return;

      setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setCommentPopup(CLOSED);
    } catch (err) {
      console.error(err);
    }
  };

  const contentDiv = useMemo(
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
      {contentDiv}
      {popupOpen.visible && !inputField && (
        <div
          style={{ position: "fixed", top: popupOpen.top, left: popupOpen.right }}
          className="z-50 rounded-lg border bg-white shadow-lg dark:bg-neutral-900"
        >
          <Button
            label="Add a comment"
            type="button"
            size="sm"
            variant="primary"
            onClick={() => setInputField(true)}
          />
        </div>
      )}
      {inputField && (
        <div
          style={{ position: "fixed", top: popupOpen.top, left: popupOpen.right }}
          className="z-50 rounded-lg border bg-white shadow-lg dark:bg-neutral-900"
        >
          <Input type="text" ref={inputRef} />
          <Button
            label="Save Comment"
            type="button"
            size="sm"
            variant="primary"
            onClick={handleSave}
          />
          {commentError && <p className="px-2 text-sm text-red-600">{commentError}</p>}
        </div>
      )}
      {commentPopup.state &&
        (() => {
          const activeComment = comments.find((c) => c.id === commentPopup.id);
          return (
            <div
              style={{
                position: "absolute",
                top: commentPopup.position.top,
                left: commentPopup.position.left,
              }}
              className="z-50 rounded-lg border dark:bg-white text-white shadow-lg bg-neutral-900"
            >
              {commentPopup.status === "PENDING" && (
                <>
                  <Button
                    label="Approve"
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => handleCommentStatus(commentPopup.id, "APPROVED")}
                  />
                  <Button
                    label="Reject"
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCommentStatus(commentPopup.id, "REJECTED")}
                  />
                </>
              )}
              <span>{commentPopup.text}</span>

              {activeComment?.replies?.map((r) => (
                <div key={r.id} className="pl-3 border-l ml-2 mt-1">
                  <span className="text-sm opacity-80">{r.author?.name}: </span>
                  <span className="text-sm">{r.text}</span>
                </div>
              ))}

              {repliedToId === commentPopup.id ? (
                <>
                  <Input type="text" ref={replyInputRef} />
                  <Button
                    label="Submit"
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => handleReplySave(commentPopup.id)}
                  />
                  <Button
                    label="X"
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setRepliedToId(null)}
                  />
                  {commentError && <p className="px-2 text-sm text-red-600">{commentError}</p>}
                </>
              ) : (
                commentPopup.status === "APPROVED" && (
                  <Button
                    label="Reply"
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => setRepliedToId(commentPopup.id)}
                  />
                )
              )}
            </div>
          );
        })()}
    </>
  );
}
