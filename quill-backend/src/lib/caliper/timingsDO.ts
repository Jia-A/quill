import { RECORD_TTL_MS } from "./timingStore";

// Holds one Caliper timing record (one instance per run id, see
// DurableObjectStore) and wipes it RECORD_TTL_MS after it was written.
export class CaliperTimingsDO {
  state: DurableObjectState;
  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
  }

  async fetch(request: Request) {
    if (request.method === "PUT") {
      await this.state.storage.put("record", await request.text());
      await this.state.storage.setAlarm(Date.now() + RECORD_TTL_MS);
      return new Response(null, { status: 204 });
    }

    if (request.method === "GET") {
      const record = await this.state.storage.get<string>("record");
      if (!record) return new Response("Not found", { status: 404 });
      return new Response(record, { headers: { "Content-Type": "application/json" } });
    }

    return new Response("Method not allowed", { status: 405 });
  }

  async alarm() {
    await this.state.storage.deleteAll();
  }
}
