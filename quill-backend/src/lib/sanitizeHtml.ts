// Server-side HTML sanitization for user-authored blog content.
//
// Blog content is rich HTML produced by the TipTap editor and is rendered with
// dangerouslySetInnerHTML on the frontend. Without sanitization, an author could
// store <script>, inline event handlers (onerror=...), or javascript: URLs that
// then execute in *other* viewers' browsers on our origin — stored XSS, which
// can steal JWT cookies or act as the victim.
//
// We sanitize on WRITE (here, authoritatively) so the database never holds
// dangerous markup, regardless of which client renders it. The frontend also
// sanitizes on render as defense in depth.
//
// ultrahtml is a parser-based sanitizer with NO DOM dependency, so it runs on
// the Cloudflare Workers edge runtime (unlike jsdom/DOMPurify-on-node).

import { transform, walkSync, ELEMENT_NODE } from "ultrahtml";
import sanitize from "ultrahtml/transformers/sanitize";

// ultrahtml's allowlist checks attribute NAMES but not URL schemes, so a
// `javascript:` href passes through its sanitizer untouched — a live XSS hole.
// This transformer neutralizes dangerous URL schemes on href/src attributes.
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

// Tags TipTap can emit that we want to keep. Anything not listed is dropped.
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

// Attributes allowed, per the tags they may appear on. Notably this list has NO
// on* event handlers and no style sink — those are the XSS vectors.
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

export async function sanitizeBlogHtml(html: string): Promise<string> {
  if (!html) return "";
  return transform(html, [
    stripUnsafeUrls(),
    sanitize({
      allowElements: ALLOWED_ELEMENTS,
      allowAttributes: ALLOWED_ATTRIBUTES,
      // dropElements is redundant with the allowlist but makes intent explicit:
      // script/style/iframe etc. and their children are removed entirely.
      dropElements: ["script", "style", "iframe", "object", "embed", "form"],
      allowComments: false,
      allowComponents: false,
      allowCustomElements: false,
    }),
  ]);
}
