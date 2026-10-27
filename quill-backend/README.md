```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>();
```

## Caliper timings

Off unless the `CALIPER_TOKEN` secret is set. Set it as a Worker secret (it
never goes in code or `wrangler.jsonc`):

```txt
npx wrangler secret put CALIPER_TOKEN
```

For `wrangler dev`, put `CALIPER_TOKEN=...` in the local `.env` (not committed).

A request to `POST /api/v1/social/:postId/generate` that carries both
`x-caliper-run: <id>` (1-64 chars of `A-Z a-z 0-9 _ -`) and
`x-caliper-token: <CALIPER_TOKEN>` gets a timing record, readable for ~10
minutes with `Authorization: Bearer <CALIPER_TOKEN>`:

```txt
curl -H "Authorization: Bearer $CALIPER_TOKEN" https://<backend>/__caliper/timings/<id>
```

```json
{
  "id": "run_1",
  "status": 200,
  "marks": { "postgresStart": 7, "postgresEnd": 533, "modelCallSent": 533, "firstChunk": 1439 }
}
```

Marks are ms since the request reached the generate route. A mark is missing
when the request stopped before that step (e.g. 401, 404, model error).

- Without both headers and a matching token the route records nothing and its
  response is unchanged (tested byte for byte). The streamed response is never altered:
  marked requests pass each chunk through untouched.
- Only steps that cross I/O are timed. On Workers the clock is frozen during
  CPU work, so JWT auth and prompt building would always read 0 ms; they are
  not recorded. `modelCallSent` is stamped just before `ai.run()`, so on
  Workers it equals `postgresEnd`.
- `firstChunk` is when the Worker received the first chunk from Workers AI,
  not when the browser received it.
- Storage: one `CaliperTimingsDO` Durable Object per run id, deleted by an
  alarm 10 minutes after the write. Without that binding (Node, tests) an
  in-memory store is used. A miss returns 404; Caliper reports "?".

- Tokens are compared in constant time (both sides SHA-256 hashed, then
  compared byte by byte).

Timings endpoint answers, in this order:

- `CALIPER_TOKEN` not set → 404, same as any unknown route.
- missing or wrong bearer token → 401, before any Durable Object call.
- malformed id → 400.
- no record → 404 `No timing record for this run id`.

Known limits: anyone holding the token can read records, and every
authenticated lookup (including for ids that don't exist) is a Durable Object
request counted against the account's daily DO limits. A wrong or missing
`x-caliper-token` on the generate request is silent: the request runs normally
and the later lookup gets 404. A malformed id on the generate request is
ignored the same way; the endpoint rejects it with 400.

Run `pnpm test` for the tests. Deploying needs the `v2` migration in
`wrangler.jsonc` (adds `CaliperTimingsDO`).
