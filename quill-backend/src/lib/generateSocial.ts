import { buildLinkedInMessages, SocialPromptInput } from "./socialPrompt";

// Workers AI deprecated the llama-3.1-8b-instruct alias on 2026-05-30 (it
// resolved to @cf/meta/infire-llama-3.1-8b-instruct, which was retired), so
// calls against it now fail with AiError 5028. Verify a replacement is live
// before changing this: several catalog-listed models are also deprecated.
const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const LINKEDIN_HARD_CAP = 1300;

export type Platform = "linkedin";

const PREAMBLE_RE =
  /^\s*(?:sure[!,.]?|okay[!,.]?|here(?:'s| is)[^:\n]*[:\n]|here you go[:\n]?|i'?d be happy[^:\n]*[:\n]?|got it[!,.]?|certainly[!,.]?)\s*/i;

function sanitize(raw: string): string {
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
function truncateAtSentence(text: string, cap: number): string {
  if (text.length <= cap) return text;

  const readMoreAt = text.lastIndexOf("Read more:");
  if (readMoreAt === -1) return cutBody(text, cap);

  const body = text.slice(0, readMoreAt).trim();
  const tail = text.slice(readMoreAt).trim();

  const room = cap - tail.length - 2; // 2 = the "\n\n" we rejoin with
  if (room <= 0) return cutBody(text, cap);

  return `${cutBody(body, room)}\n\n${tail}`;
}

export async function generateSocialDraft(
  ai: Ai,
  post: SocialPromptInput,
  platform: Platform
): Promise<string | null> {
  if (platform !== "linkedin") return null;

  const messages = buildLinkedInMessages(post);
  try {
    const res: any = await ai.run(MODEL, {
      messages,
      max_tokens: 700,
      temperature: 0.6,
    });
    const text: string | undefined =
      typeof res === "string" ? res : (res?.response ?? res?.result?.response);
    if (!text) return null;
    return truncateAtSentence(sanitize(text), LINKEDIN_HARD_CAP);
  } catch (err) {
    console.error("Workers AI failed", err);
    return null;
  }
}

export const PLATFORM_CAPS: Record<Platform, number> = {
  linkedin: LINKEDIN_HARD_CAP,
};
