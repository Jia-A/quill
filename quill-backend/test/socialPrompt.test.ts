import { describe, it, expect } from "vitest";
import { buildLinkedInMessages } from "../src/lib/socialPrompt";

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
