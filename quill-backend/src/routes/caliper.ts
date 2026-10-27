import { Hono } from "hono";
import { getTimingStore, isValidRunId } from "../lib/caliper/timingStore";
import { tokenMatches } from "../lib/caliper/token";

export const caliperRouter = new Hono<{
  Bindings: {
    CALIPER_TIMINGS_DO?: DurableObjectNamespace;
    CALIPER_TOKEN?: string;
  };
}>();

caliperRouter.get("/timings/:id", async (c) => {
  // No secret configured: the feature is off and this route doesn't exist.
  const expected = c.env.CALIPER_TOKEN;
  if (!expected) return c.notFound();

  // Checked before anything else, so an unauthenticated call never reaches
  // the Durable Object.
  const bearer = /^Bearer (.+)$/.exec(c.req.header("authorization") ?? "")?.[1];
  if (bearer === undefined || !(await tokenMatches(bearer, expected))) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Missing or invalid Caliper token" } },
      401
    );
  }

  const id = c.req.param("id");
  if (!isValidRunId(id)) {
    return c.json(
      {
        error: {
          code: "INVALID_RUN_ID",
          message: "Run id must be 1-64 characters of A-Z, a-z, 0-9, _ or -",
        },
      },
      400
    );
  }

  const record = await getTimingStore(c.env).get(id);
  if (!record) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "No timing record for this run id" } },
      404
    );
  }
  return c.json(record);
});
