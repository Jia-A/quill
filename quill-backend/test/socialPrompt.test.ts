import { describe, it, expect } from "vitest";
import { buildLinkedInMessages, buildLinkedInPrompt } from "../src/lib/socialPrompt";

// The exact user message for a post, so naming its parts for Caliper can't change what the model gets.
describe("buildLinkedInMessages", () => {
  it("builds the user message from labelled pieces, joined by blank lines", () => {
    const [, user] = buildLinkedInMessages({
      title: "A title",
      content: "<p>Body</p><pre><code>const x = 1;</code></pre>",
      summary: "Short summary",
      authorName: "Jam",
    });
    expect(user).toEqual({
      role: "user",
      content: [
        "Author: Jam",
        "Title: A title",
        "Summary: Short summary",
        "CODE SNIPPET (include a short illustrative version in the post):\nconst x = 1;",
        "Article:\nBody const x = 1;",
      ].join("\n\n"),
    });
  });

  it("leaves out author and summary when there are none, and says when there's no code", () => {
    const [, user] = buildLinkedInMessages({
      title: "T",
      content: "<p>Body</p>",
      summary: null,
      authorName: null,
    });
    expect(user!.content).toBe(
      "Title: T\n\nNo code snippet — write prose only, do not invent code.\n\nArticle:\nBody"
    );
  });
});

// Who wrote each part, for Caliper (sizes and labels only). Only the post's author can generate,
// so the post's own text is the user's; the instructions and the fixed no-code line are the app's.
// summary has no source: nothing in Quill's API writes it, so who did isn't known.
describe("buildLinkedInPrompt parts", () => {
  it("labels each part's source, and every part's text is in its message", () => {
    const { messages, parts } = buildLinkedInPrompt({
      title: "A title",
      content: "<p>Body</p><pre><code>const x = 1;</code></pre>",
      summary: "Short summary",
      authorName: "Jam",
    });
    expect(parts.map((p) => [p.message, p.name, p.source])).toEqual([
      [0, "instructions", "app"],
      [1, "author", "user"],
      [1, "title", "user"],
      [1, "summary", undefined],
      [1, "code_snippet", "user"],
      [1, "article", "user"],
    ]);
    expect(Object.hasOwn(parts[3]!, "source")).toBe(false);
    for (const p of parts) expect(messages[p.message]!.content.includes(p.text)).toBe(true);
    expect(parts[0]!.text).toBe(messages[0]!.content);
  });

  it("the fixed no-code line is the app's", () => {
    const { parts } = buildLinkedInPrompt({
      title: "T",
      content: "<p>Body</p>",
      summary: null,
      authorName: null,
    });
    expect(parts.find((p) => p.name === "code_snippet")!.source).toBe("app");
  });
});
