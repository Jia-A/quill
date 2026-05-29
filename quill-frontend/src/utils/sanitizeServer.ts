// Server-safe HTML sanitization for use in React Server Components, where
// DOMPurify can't run (no browser DOM). Uses ultrahtml, a parser-based
// sanitizer with no DOM dependency — the same library the backend uses.
//
// This is the render-side defense-in-depth layer for the public blog page,
// which is a Server Component. Content is already sanitized on write by the
// backend; this is a second barrier at the render boundary.

import { transform, walkSync, ELEMENT_NODE } from "ultrahtml";
import sanitize from "ultrahtml/transformers/sanitize";

// ultrahtml's allowlist checks attribute names but not URL schemes, so a
// `javascript:` href would otherwise pass through. Strip unsafe schemes.
const SAFE_URL = /^(https?:|mailto:|tel:|\/|#|\.)/i;
function stripUnsafeUrls() {
  return (doc: any) => {
    walkSync(doc, (node: any) => {
      if (node.type !== ELEMENT_NODE || !node.attributes) return;
      for (const attr of ["href", "src"]) {
        const val = node.attributes[attr];
        if (typeof val === "string" && val.trim() && !SAFE_URL.test(val.trim())) {
          delete node.attributes[attr];
        }
      }
    });
    return doc;
  };
}

const ALLOWED_ELEMENTS = [
  "p",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "mark",
  "sub",
  "sup",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "a",
  "img",
  "span",
  "div",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  href: ["a"],
  target: ["a"],
  rel: ["a"],
  src: ["img"],
  alt: ["img"],
  title: ["a", "img"],
  width: ["img"],
  height: ["img"],
  class: ["*"],
  colspan: ["td", "th"],
  rowspan: ["td", "th"],
  "data-text-align": ["*"],
  "text-align": ["*"],
};

export async function sanitizeBlogHtmlServer(html: string): Promise<string> {
  if (!html) return "";
  return transform(html, [
    stripUnsafeUrls(),
    sanitize({
      allowElements: ALLOWED_ELEMENTS,
      allowAttributes: ALLOWED_ATTRIBUTES,
      dropElements: ["script", "style", "iframe", "object", "embed", "form"],
      allowComments: false,
      allowComponents: false,
      allowCustomElements: false,
    }),
  ]);
}
