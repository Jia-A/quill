import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
const CALIPER_TOKEN = "caliper-test-token";
const BEARER = { authorization: `Bearer ${CALIPER_TOKEN}` };
let env: Record<string, unknown>;
let token: string;

beforeEach(async () => {
  env = { JWT_SECRET, DATABASE_URL: "unused", AI: fakeAi(), CALIPER_TOKEN };
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

// Status, every header (not a subset: an added header would fail this) and
// the exact bytes the generate route returned before the timings change.
async function expectUnchangedResponse(res: Response) {
  const body = new Uint8Array(await res.arrayBuffer());
  expect(res.status).toBe(200);
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
}

async function spyOnStore() {
  const { MemoryStore } = await import("../src/lib/caliper/timingStore");
  return {
    put: vi.spyOn(MemoryStore.prototype, "put"),
    get: vi.spyOn(MemoryStore.prototype, "get"),
  };
}

afterEach(() => vi.restoreAllMocks());

describe("generate route, request without x-caliper-run", () => {
  it("returns exactly the status, headers and bytes it returned before the timings change", async () => {
    await expectUnchangedResponse(await generate());
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
    const timings = await app.request("/__caliper/timings/never_sent", { headers: BEARER }, env);
    expect(timings.status).toBe(404);
    expect(await timings.json()).toEqual({
      error: { code: "NOT_FOUND", message: "No timing record for this run id" },
    });
  });
});

describe("generate route, request with x-caliper-run", () => {
  it("stores a record with postgres, model-call and first-chunk timestamps in order", async () => {
    const res = await generate({ "x-caliper-run": "run_abc123", "x-caliper-token": CALIPER_TOKEN });
    expect(Buffer.from(await res.arrayBuffer()).toString("utf8")).toBe(CHUNKS.join(""));
    await delay(0);

    const timings = await app.request("/__caliper/timings/run_abc123", { headers: BEARER }, env);
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

  it("tags the record with runtime: workers", async () => {
    const res = await generate({
      "x-caliper-run": "run_runtime",
      "x-caliper-token": CALIPER_TOKEN,
    });
    await res.arrayBuffer();
    await delay(0);

    const timings = await app.request("/__caliper/timings/run_runtime", { headers: BEARER }, env);
    expect(timings.status).toBe(200);
    expect(((await timings.json()) as TimingRecord).runtime).toBe("workers");
  });
});

describe("timings endpoint, malformed id", () => {
  it("rejects a malformed run id on the timings endpoint with a clear error", async () => {
    const timings = await app.request("/__caliper/timings/bad%20id!", { headers: BEARER }, env);
    expect(timings.status).toBe(400);
    expect(await timings.json()).toEqual({
      error: {
        code: "INVALID_RUN_ID",
        message: "Run id must be 1-64 characters of A-Z, a-z, 0-9, _ or -",
      },
    });
  });
});

describe("timings endpoint, Caliper token", () => {
  const UNAUTHORIZED = {
    error: { code: "UNAUTHORIZED", message: "Missing or invalid Caliper token" },
  };

  it("answers 401 without an Authorization header and never reads the store", async () => {
    const store = await spyOnStore();
    const timings = await app.request("/__caliper/timings/run_abc123", {}, env);
    expect(timings.status).toBe(401);
    expect(await timings.json()).toEqual(UNAUTHORIZED);
    expect(store.get).not.toHaveBeenCalled();
  });

  it("answers 401 for a wrong bearer token and never reads the store", async () => {
    const store = await spyOnStore();
    const timings = await app.request(
      "/__caliper/timings/run_abc123",
      { headers: { authorization: "Bearer not-the-token" } },
      env
    );
    expect(timings.status).toBe(401);
    expect(await timings.json()).toEqual(UNAUTHORIZED);
    expect(store.get).not.toHaveBeenCalled();
  });

  it("answers 401 when the token is sent without the Bearer scheme", async () => {
    const store = await spyOnStore();
    const timings = await app.request(
      "/__caliper/timings/run_abc123",
      { headers: { authorization: CALIPER_TOKEN } },
      env
    );
    expect(timings.status).toBe(401);
    expect(store.get).not.toHaveBeenCalled();
  });
});

describe("generate route, x-caliper-run without a valid x-caliper-token", () => {
  for (const [label, headers] of [
    ["wrong token", { "x-caliper-run": "run_wrong_tok", "x-caliper-token": "not-the-token" }],
    ["no token", { "x-caliper-run": "run_no_tok" }],
  ] as const) {
    it(`${label}: behaves like an unmarked request and records nothing`, async () => {
      const store = await spyOnStore();
      await expectUnchangedResponse(await generate(headers));
      await delay(0);
      expect(store.put).not.toHaveBeenCalled();

      const timings = await app.request(
        `/__caliper/timings/${headers["x-caliper-run"]}`,
        { headers: BEARER },
        env
      );
      expect(timings.status).toBe(404);
    });
  }
});

describe("CALIPER_TOKEN not set", () => {
  beforeEach(() => {
    delete env.CALIPER_TOKEN;
  });

  it("records nothing, even for a request with both Caliper headers", async () => {
    const store = await spyOnStore();
    await expectUnchangedResponse(
      await generate({ "x-caliper-run": "run_off", "x-caliper-token": CALIPER_TOKEN })
    );
    await delay(0);
    expect(store.put).not.toHaveBeenCalled();
  });

  it("answers the timings route exactly like a route that doesn't exist", async () => {
    const store = await spyOnStore();
    const timings = await app.request("/__caliper/timings/run_off", { headers: BEARER }, env);
    const missing = await app.request("/no/such/route", { headers: BEARER }, env);
    expect(timings.status).toBe(404);
    expect(await timings.json()).toEqual(await missing.json());
    expect(store.get).not.toHaveBeenCalled();
  });
});
