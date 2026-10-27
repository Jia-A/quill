import { describe, it, expect, vi, beforeEach } from "vitest";
import { sign } from "hono/jwt";
import type { TimingRecord } from "../src/lib/caliper/timingStore";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const POST = {
  id: "post-1",
  authorId: "user-1",
  visibility: "PUBLIC",
  title: "A title",
  content: "<p>Body</p>",
  summary: null,
  author: { name: "Jam" },
};

// Prisma goes over the network on Workers; here it is a fake that takes 20ms.
vi.mock("../src/lib/prisma", () => ({
  getPrisma: () => ({
    post: {
      findUnique: async () => {
        await delay(20);
        return POST;
      },
    },
  }),
}));

const CHUNKS = [
  'data: {"response":"Hello"}\n\n',
  'data: {"response":" world"}\n\n',
  "data: [DONE]\n\n",
];

// Fake Workers AI: answers after 20ms, then streams CHUNKS 10ms apart.
function fakeAi() {
  return {
    run: async () => {
      await delay(20);
      const enc = new TextEncoder();
      return new ReadableStream<Uint8Array>({
        async start(ctrl) {
          for (const chunk of CHUNKS) {
            await delay(10);
            ctrl.enqueue(enc.encode(chunk));
          }
          ctrl.close();
        },
      });
    },
  };
}

const { default: app } = await import("../src/index");

const JWT_SECRET = "test-secret";
let env: Record<string, unknown>;
let token: string;

beforeEach(async () => {
  env = { JWT_SECRET, DATABASE_URL: "unused", AI: fakeAi() };
  token = await sign({ id: "user-1" }, JWT_SECRET, "HS256");
});

function generate(extraHeaders: Record<string, string> = {}) {
  return app.request(
    "/api/v1/social/post-1/generate",
    {
      method: "POST",
      headers: {
        origin: "https://lets-quill.vercel.app",
        authorization: token,
        "content-type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify({ platform: "linkedin" }),
    },
    env
  );
}

describe("generate route, request without x-caliper-run", () => {
  it("returns exactly the status, headers and bytes it returned before the timings change", async () => {
    const res = await generate();
    const body = new Uint8Array(await res.arrayBuffer());

    expect(res.status).toBe(200);
    // Every header, not a subset: an added header would fail this.
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => (headers[key] = value));
    expect(headers).toEqual({
      "access-control-allow-origin": "https://lets-quill.vercel.app",
      "cache-control": "no-cache",
      "content-type": "text/event-stream",
      "timing-allow-origin": "https://lets-quill.vercel.app",
      vary: "Origin",
    });
    expect(Buffer.from(body).toString("utf8")).toBe(CHUNKS.join(""));
  });

  it("never touches the timing store", async () => {
    const { MemoryStore } = await import("../src/lib/caliper/timingStore");
    const put = vi.spyOn(MemoryStore.prototype, "put");
    const res = await generate();
    await res.arrayBuffer();
    await delay(0);
    expect(put).not.toHaveBeenCalled();
    put.mockRestore();
  });
});

describe("timings endpoint", () => {
  it("answers 404 with a clear message for a run id it has no record of", async () => {
    const timings = await app.request("/__caliper/timings/never_sent", {}, env);
    expect(timings.status).toBe(404);
    expect(await timings.json()).toEqual({
      error: { code: "NOT_FOUND", message: "No timing record for this run id" },
    });
  });
});

describe("generate route, request with x-caliper-run", () => {
  it("stores a record with postgres, model-call and first-chunk timestamps in order", async () => {
    const res = await generate({ "x-caliper-run": "run_abc123" });
    expect(Buffer.from(await res.arrayBuffer()).toString("utf8")).toBe(CHUNKS.join(""));
    await delay(0);

    const timings = await app.request("/__caliper/timings/run_abc123", {}, env);
    expect(timings.status).toBe(200);
    const record = (await timings.json()) as TimingRecord;

    expect(record.id).toBe("run_abc123");
    expect(record.status).toBe(200);
    const m = record.marks;
    expect(Object.keys(m)).toEqual(["postgresStart", "postgresEnd", "modelCallSent", "firstChunk"]);
    const { postgresStart, postgresEnd, modelCallSent, firstChunk } = m as Required<typeof m>;
    for (const v of [postgresStart, postgresEnd, modelCallSent, firstChunk]) {
      expect(Number.isInteger(v)).toBe(true);
    }
    expect(postgresStart).toBeGreaterThanOrEqual(0);
    // The fakes wait 20ms (Prisma) and 20+10ms (AI): those gaps must show.
    expect(postgresEnd - postgresStart).toBeGreaterThanOrEqual(15);
    expect(modelCallSent).toBeGreaterThanOrEqual(postgresEnd);
    expect(firstChunk - modelCallSent).toBeGreaterThanOrEqual(25);
  });
});

describe("timings endpoint, malformed id", () => {
  it("rejects a malformed run id on the timings endpoint with a clear error", async () => {
    const timings = await app.request("/__caliper/timings/bad%20id!", {}, env);
    expect(timings.status).toBe(400);
    expect(await timings.json()).toEqual({
      error: {
        code: "INVALID_RUN_ID",
        message: "Run id must be 1-64 characters of A-Z, a-z, 0-9, _ or -",
      },
    });
  });
});
