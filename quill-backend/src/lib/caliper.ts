// Caliper timings (caliper-timings): the Hono glue around the package's fetch adapter and
// Durable Object store. Requests without x-caliper-run pass straight through.
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import {
  type CaliperRun,
  DurableObjectStore,
  finish,
  handle,
  MemoryStore,
  start,
  type TimingStore,
} from "caliper-timings/workers";

export { CaliperTimingsDO } from "caliper-timings/workers";

type CaliperBindings = { CALIPER_TIMINGS_DO?: DurableObjectNamespace; CALIPER_TOKEN?: string };

// Single-process only (tests, local dev without the binding): on Workers each isolate has its
// own MemoryStore, so the Durable Object store is used whenever the binding exists.
const memoryStore = new MemoryStore();
const timingStore = (env: CaliperBindings): TimingStore =>
  env.CALIPER_TIMINGS_DO ? new DurableObjectStore(env.CALIPER_TIMINGS_DO) : memoryStore;

function deferOn(c: Context) {
  return (p: Promise<void>) => {
    try {
      c.executionCtx.waitUntil(p);
    } catch {
      // No execution context outside Workers (Node, tests): p still runs.
    }
  };
}

// Recording needs x-caliper-run, an x-caliper-token matching the CALIPER_TOKEN secret, and the
// secret to be set at all; anything less runs the request exactly as an unmarked one.
export const caliperRun = createMiddleware<{
  Bindings: CaliperBindings;
  Variables: { caliperRun?: CaliperRun };
}>(async (c, next) => {
  if (c.req.header("x-caliper-run") === undefined) return next();
  const run = await start(c.req.raw, {
    token: c.env.CALIPER_TOKEN,
    store: timingStore(c.env),
    defer: deferOn(c),
  });
  if (!run) return next();
  c.set("caliperRun", run);
  await next();
  finish(run, c.res);
});

// GET /__caliper/timings/:id. With no CALIPER_TOKEN it answers like a route that doesn't exist.
export async function caliperTimings(c: Context<{ Bindings: CaliperBindings }>) {
  const store = timingStore(c.env);
  return (await handle(c.req.raw, { token: c.env.CALIPER_TOKEN, store })) ?? c.notFound();
}
