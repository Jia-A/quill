import { Comment } from "@/types/CommentProps";

export const CONTEXT_LENGTH = 32;
export function getPlainText(container: Node) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let text = "";
  let node;
  while ((node = walker.nextNode())) {
    text += node.textContent;
  }
  return text;
}

export function resolveAnchor(postText: string, comment: Comment) {
  if (comment.startOffset === null || comment.endOffset === null || comment.anchorText === null)
    return null;
  const { startOffset, endOffset, anchorText, prefix, suffix } = comment;

  if (postText.substring(startOffset, endOffset) === anchorText) {
    return { start: startOffset, end: endOffset };
  }

  // 2. Locate by context: the anchor plus its surrounding text is far more
  //    likely to be unique than the anchor on its own.
  if (prefix || suffix) {
    const needle = `${prefix ?? ""}${anchorText}${suffix ?? ""}`;
    const at = postText.indexOf(needle);
    if (at !== -1 && postText.indexOf(needle, at + 1) === -1) {
      const start = at + (prefix?.length ?? 0);
      return { start, end: start + anchorText.length };
    }
  }

  const at = postText.indexOf(anchorText);
  if (at === -1) return null;
  if (postText.indexOf(anchorText, at + 1) !== -1) return null;

  return { start: at, end: at + anchorText.length };
}

export function highlightRange(
  container: Node,
  start: number,
  end: number,
  commentId: string,
  status: string,
  isOwnComment = false
) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let runningCount = 0;
  const nodesToWrap: { node: Text; from: number; to: number }[] = [];
  let node: Text | null;

  while ((node = walker.nextNode() as Text)) {
    const nodeStart = runningCount;
    const nodeEnd = runningCount + node.textContent!.length;

    if (nodeEnd > start && nodeStart < end) {
      nodesToWrap.push({
        node,
        from: Math.max(0, start - nodeStart),
        to: Math.min(node.textContent!.length, end - nodeStart),
      });
    }
    runningCount = nodeEnd;
  }

  for (const { node, from, to } of nodesToWrap) {
    const middle = from > 0 ? node.splitText(from) : node;
    if (to - from < middle.textContent!.length) {
      middle.splitText(to - from);
    }
    const mark = document.createElement("mark");
    mark.dataset.commentId = commentId;
    // Styling lives in globals.css keyed off these attributes, so marks stay
    // on-palette in both themes instead of hardcoding Tailwind colour classes.
    if (status === "PENDING") {
      // The author of a pending comment sees their own in amber, so it reads
      // as "submitted, waiting" rather than as an ordinary unapproved mark.
      if (isOwnComment) {
        mark.dataset.commentMine = "";
      } else {
        mark.dataset.commentPending = "";
      }
    } else {
      mark.dataset.commentApproved = "";
    }
    middle.parentNode!.insertBefore(mark, middle);
    mark.appendChild(middle);
  }
}

export function clearHighlights(container: HTMLElement) {
  const marks = container.querySelectorAll("mark[data-comment-id]");
  marks.forEach((mark) => {
    mark.replaceWith(...mark.childNodes);
  });
  container.normalize();
}

export function getOffsets(container: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return null;

  const range = selection.getRangeAt(0);
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);

  let runningCount = 0;
  let startOffset = null;
  let endOffset = null;
  let fullText = "";
  let node: Text | null;

  while ((node = walker.nextNode() as Text | null)) {
    if (node === range.startContainer) startOffset = runningCount + range.startOffset;
    if (node === range.endContainer) endOffset = runningCount + range.endOffset;
    fullText += node.textContent;
    runningCount += node.textContent.length;
  }

  if (startOffset === null || endOffset === null) return null;
  return {
    startOffset,
    endOffset,
    anchorText: range.toString(),
    prefix: fullText.slice(Math.max(0, startOffset - CONTEXT_LENGTH), startOffset),
    suffix: fullText.slice(endOffset, endOffset + CONTEXT_LENGTH),
    range,
  };
}
