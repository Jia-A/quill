import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { getTimingStore, isValidRunId, TimingMark, TimingStore } from "./timingStore";
import { tokenMatches } from "./token";

export const RUN_HEADER = "x-caliper-run";
export const TOKEN_HEADER = "x-caliper-token";

// Only steps that cross I/O are timed. On Workers, Date.now() is frozen while
// code runs and only advances at I/O, so a pure-CPU step (JWT auth, building
// the prompt) would always read 0 ms. That's a frozen clock, not a measurement.
// The postgres marks bracket the ownership query; modelCallSent is stamped just
// before ai.run(), so on Workers it equals postgresEnd plus nothing measurable.
export class CaliperRun {
  private readonly start = Date.now();
  private readonly marks: Partial<Record<TimingMark, number>> = {};
  private watchingStream = false;
  status: number | null = null;

  constructor(
    readonly id: string,
    private store: TimingStore,
    private defer: (p: Promise<void>) => void
  ) {}

  mark(name: TimingMark) {
    this.marks[name] = Date.now() - this.start;
  }

  // Passes every chunk through unchanged (same bytes, same chunk boundaries);
  // it only notes when the first one arrives, then saves the record.
  watchFirstChunk(stream: ReadableStream): ReadableStream {
    this.watchingStream = true;
    let seen = false;
    return stream.pipeThrough(
      new TransformStream({
        transform: (chunk, controller) => {
          if (!seen) {
            seen = true;
            this.mark("firstChunk");
            this.save();
          }
          controller.enqueue(chunk);
        },
        flush: () => {
          if (!seen) this.save();
        },
      })
    );
  }

  save() {
    const record = { id: this.id, status: this.status, marks: { ...this.marks } };
    this.defer(
      this.store.put(this.id, record).catch((err) => {
        console.error("Caliper timing record not saved", err);
      })
    );
  }

  get savesOnStream() {
    return this.watchingStream;
  }
}

function deferOn(c: Context) {
  return (p: Promise<void>) => {
    try {
      c.executionCtx.waitUntil(p);
    } catch {
      // No execution context outside Workers (Node, tests): p still runs.
    }
  };
}

type CaliperEnv = {
  Bindings: { CALIPER_TIMINGS_DO?: DurableObjectNamespace; CALIPER_TOKEN?: string };
  Variables: { caliperRun?: CaliperRun };
};

// Without x-caliper-run this only reads one header and calls next().
// Recording needs x-caliper-run, an x-caliper-token matching the CALIPER_TOKEN
// secret, and the secret to be set at all; anything less runs the request
// exactly as an unmarked one. A malformed id is ignored here and rejected with
// a clear 400 by the timings endpoint when Caliper asks for it.
export const caliperRun = createMiddleware<CaliperEnv>(async (c, next) => {
  const id = c.req.header(RUN_HEADER);
  if (id === undefined) return next();
  const expected = c.env.CALIPER_TOKEN;
  const given = c.req.header(TOKEN_HEADER);
  if (!expected || given === undefined || !isValidRunId(id)) return next();
  if (!(await tokenMatches(given, expected))) return next();

  const run = new CaliperRun(id, getTimingStore(c.env), deferOn(c));
  c.set("caliperRun", run);
  await next();
  run.status = c.res.status;
  if (!run.savesOnStream) run.save();
});
