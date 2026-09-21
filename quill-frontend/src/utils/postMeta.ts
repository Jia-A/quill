import { convert } from "html-to-text";

/** Strip HTML to plain text for excerpts and word counts. */
export function toPlainText(html: string) {
  return convert(html || "", {
    wordwrap: false,
    selectors: [{ selector: "a", options: { ignoreHref: true } }],
  })
    .replace(/\s+/g, " ")
    .trim();
}

export function getExcerpt(html: string) {
  return toPlainText(html);
}

export function getReadingTime(html: string) {
  const words = toPlainText(html).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

export function formatDate(date: string | null, long = false) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: long ? "long" : "short",
    day: "numeric",
  });
}
