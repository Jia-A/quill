import { Hono } from "hono";
import { getTimingStore, isValidRunId } from "../lib/caliper/timingStore";

export const caliperRouter = new Hono<{
  Bindings: {
    CALIPER_TIMINGS_DO?: DurableObjectNamespace;
  };
}>();

caliperRouter.get("/timings/:id", async (c) => {
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
