// Where Caliper timing records live. The run/route code only sees TimingStore,
// so swapping storage never touches the generate path.

export type TimingMark = "postgresStart" | "postgresEnd" | "modelCallSent" | "firstChunk";

export type TimingRecord = {
  id: string;
  status: number | null;
  // ms since the request reached the generate route; a mark is absent when the
  // request never got that far (e.g. 401, 404, model error).
  marks: Partial<Record<TimingMark, number>>;
};

export interface TimingStore {
  put(id: string, record: TimingRecord): Promise<void>;
  get(id: string): Promise<TimingRecord | null>;
}

export const RECORD_TTL_MS = 10 * 60 * 1000;

const RUN_ID = /^[A-Za-z0-9_-]{1,64}$/;
export const isValidRunId = (id: string) => RUN_ID.test(id);

// Single-process servers only: on Workers each isolate has its own Map, so a
// read can land on an isolate that never saw the write.
export class MemoryStore implements TimingStore {
  private records = new Map<string, { record: TimingRecord; expiresAt: number }>();

  async put(id: string, record: TimingRecord) {
    const now = Date.now();
    for (const [key, entry] of this.records) {
      if (entry.expiresAt <= now) this.records.delete(key);
    }
    this.records.set(id, { record, expiresAt: now + RECORD_TTL_MS });
  }

  async get(id: string) {
    const entry = this.records.get(id);
    if (!entry || entry.expiresAt <= Date.now()) return null;
    return entry.record;
  }
}

// One CaliperTimingsDO instance per run id; it deletes itself via an alarm
// RECORD_TTL_MS after the last write.
export class DurableObjectStore implements TimingStore {
  constructor(private namespace: DurableObjectNamespace) {}

  private stub(id: string) {
    return this.namespace.get(this.namespace.idFromName(id));
  }

  async put(id: string, record: TimingRecord) {
    const res = await this.stub(id).fetch("https://caliper-timings/record", {
      method: "PUT",
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error(`CaliperTimingsDO put failed: ${res.status}`);
  }

  async get(id: string) {
    const res = await this.stub(id).fetch("https://caliper-timings/record");
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`CaliperTimingsDO get failed: ${res.status}`);
    return (await res.json()) as TimingRecord;
  }
}

const memoryStore = new MemoryStore();

export function getTimingStore(env: { CALIPER_TIMINGS_DO?: DurableObjectNamespace }): TimingStore {
  return env.CALIPER_TIMINGS_DO ? new DurableObjectStore(env.CALIPER_TIMINGS_DO) : memoryStore;
}
