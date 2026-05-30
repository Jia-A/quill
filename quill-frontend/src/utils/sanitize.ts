// Client-side HTML sanitization, applied right before dangerouslySetInnerHTML.
//
// This is defense in depth: the backend already sanitizes blog content on write
// (see quill-backend/src/lib/sanitizeHtml.ts), so the DB should only ever hold
// clean HTML. Sanitizing again at the render boundary protects against anything
// that predates the backend fix, or content arriving from another path.
//
// DOMPurify runs against the real browser DOM, so these helpers must only be
// called in client components (the render sites already are).

import DOMPurify, { type Config } from "dompurify";

// Allow the formatting tags/attributes TipTap emits; DOMPurify's defaults
// already strip <script>, on* handlers, and javascript: URLs. RETURN_TRUSTED_TYPE
// is left unset so sanitize() resolves to the string-returning overload.
const CONFIG: Config = {
  ADD_ATTR: ["target", "data-text-align"],
};

/** Sanitize untrusted blog HTML for safe rendering via dangerouslySetInnerHTML. */
export function sanitizeBlogHtml(html: string): string {
  return DOMPurify.sanitize(html ?? "", CONFIG);
}
