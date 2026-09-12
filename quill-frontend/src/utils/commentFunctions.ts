import { Comment } from "@/types/CommentProps";

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
  const { startOffset, endOffset, anchorText } = comment;

  if (postText.substring(startOffset, endOffset) === anchorText) {
    return { start: startOffset, end: endOffset };
  }

  const foundAt = postText.indexOf(anchorText);
  if (foundAt !== -1) {
    return { start: foundAt, end: foundAt + anchorText.length };
  }

  return null;
}

export function highlightRange(
  container: Node,
  start: number,
  end: number,
  commentId: string,
  status: string
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
    mark.className =
      status === "PENDING" ? "bg-red-300/40 cursor-pointer" : "bg-amber-300/40 cursor-pointer";
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

export function getOffsets(container) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return null;

  const range = selection.getRangeAt(0);
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);

  let runningCount = 0;
  let startOffset = null;
  let endOffset = null;
  let node;

  while ((node = walker.nextNode())) {
    if (node === range.startContainer) startOffset = runningCount + range.startOffset;
    if (node === range.endContainer) endOffset = runningCount + range.endOffset;
    runningCount += node.textContent.length;
  }

  return { startOffset, endOffset, anchorText: range.toString(), range };
}
