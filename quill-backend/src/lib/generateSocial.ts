import { buildLinkedInMessages, SocialPromptInput } from "./socialPrompt";

// Workers AI deprecated the llama-3.1-8b-instruct alias on 2026-05-30 (it
// resolved to @cf/meta/infire-llama-3.1-8b-instruct, which was retired), so
// calls against it now fail with AiError 5028. Verify a replacement is live
// before changing this: several catalog-listed models are also deprecated.
const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const LINKEDIN_HARD_CAP = 1300;

export type Platform = "linkedin";

// Returns Workers AI's SSE stream untouched. Sanitizing and the 1300-char cut
// need the full text, so the client applies them once the stream ends.
export async function streamSocialDraft(
  ai: Ai,
  post: SocialPromptInput,
  platform: Platform
): Promise<ReadableStream | null> {
  if (platform !== "linkedin") return null;

  const messages = buildLinkedInMessages(post);
  try {
    // Errors like AiError 5028 throw here, before any bytes are sent, so the
    // route can still answer with a normal JSON error status.
    const stream = await ai.run(MODEL, {
      messages,
      // ~4 chars/token, so 300 tokens (~1200 chars) bounds a 150-220 word
      // post near LINKEDIN_HARD_CAP; the client still cuts anything over the
      // cap back to a sentence boundary.
      max_tokens: 300,
      temperature: 0.6,
      stream: true,
    });
    return stream as ReadableStream;
  } catch (err) {
    console.error("Workers AI stream failed", err);
    return null;
  }
}

export const PLATFORM_CAPS: Record<Platform, number> = {
  linkedin: LINKEDIN_HARD_CAP,
};
