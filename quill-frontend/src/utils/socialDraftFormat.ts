// Post-processing for a streamed LinkedIn draft. Runs once on the full text
// after the stream ends; the "Read more" link is added here, not by the model.
// The backend's 1300-char check on PUT is still the real rule.

const PREAMBLE_RE =
  /^\s*(?:sure[!,.]?|okay[!,.]?|here(?:'s| is)[^:\n]*[:\n]|here you go[:\n]?|i'?d be happy[^:\n]*[:\n]?|got it[!,.]?|certainly[!,.]?)\s*/i;

export function sanitizeDraft(raw: string): string {
  let t = raw.trim();
  // Strip leading model preamble lines like "Here's the LinkedIn post:"
  for (let i = 0; i < 3; i++) {
    const next = t.replace(PREAMBLE_RE, "");
    if (next === t) break;
    t = next.trimStart();
  }
  // Drop wrapping quotes if the whole post is quoted
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim();
  }
  // Replace em/en dashes with comma+space (keeps prose readable, never em-dash)
  t = t.replace(/\s*[—–]\s*/g, ", ");
  return t.trim();
}

function cutBody(body: string, cap: number): string {
  if (body.length <= cap) return body;
  const slice = body.slice(0, cap);
  const lastStop = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("\n\n")
  );
  if (lastStop > cap * 0.6) return slice.slice(0, lastStop + 1).trim();
  return slice.trim();
}

const HASHTAG_LINE_RE = /^(?:#[\p{L}\p{N}_]+\s*)+$/u;

// Assembles the final post as body + "\n\nRead more: <url>" + "\n" + hashtags,
// cutting only the body (at a sentence boundary) so the whole fits in `cap`.
// The link is added even when the model leaves out the hashtag line.
export function assembleDraft(text: string, postUrl: string, cap: number): string {
  // The model is told not to write the link; drop one anyway if it does.
  const lines = text.split("\n").filter((line) => !/^\s*read more:/i.test(line));
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();

  const last = lines[lines.length - 1]?.trim() ?? "";
  const hashtags = HASHTAG_LINE_RE.test(last) ? last : "";
  if (hashtags) lines.pop();
  const body = lines.join("\n").trim();

  const tail = `Read more: ${postUrl}` + (hashtags ? `\n${hashtags}` : "");
  const room = Math.max(cap - tail.length - 2, 0); // 2 = the "\n\n" before the link
  return `${cutBody(body, room)}\n\n${tail}`;
}
