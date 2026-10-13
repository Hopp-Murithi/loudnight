# Plan 04: Neighbourhood taste fingerprint

Status: Built and verified locally (Oct 13). Waiting on the hosted migration and the UI review.
Depends on: 02
Phase: 2
Judging criteria: Technological Implementation (depth of Qloo use), Quality of the Idea (cross-domain taste for the supply side)

## Goal

For a venue's location, Encore builds a taste fingerprint: the top over-indexing entities and tags in each of 8 or more domains with their affinity scores, plus the area's demographic skew. Every Qloo answer is cached privately in `qloo_cache`, and every number in the fingerprint keeps its receipt (cache row and JSON path). The fingerprint is shown to the owner as a readable card, so the "read the neighbourhood" step is visible, not hidden.

## Brief coverage

Pipeline step 2: "Qloo insights are queried with the venue's location and a radius (default 2 km) across artists, films, TV, brands, places, books, podcasts and tags, plus the area's demographic skew. The output is a taste fingerprint: the top over-indexing entities and tags per domain, with affinity scores." Feature table: "Neighbourhood taste profile". Risk: "Qloo rate limits": "Cache every response".

## Scope

In: `modules/taste` (cached Qloo access, fingerprint builder, demographic skew), the step `read_neighbourhood` (service method plus `run_steps` rows), the `TasteFingerprintCard` component, a script to print a fingerprint for a venue.
Out: run orchestration and streaming (plan 07), concept generation (plan 06).

## Design

- `taste.repository.ts` (service role, allowed use): `findByHash(hash)`, `insert(result)`; `expires_at` from `QLOO.cacheTtlDays` marks when to refresh, never when to delete (receipts must outlive freshness; Qloo allows private caching with no time limit).
- `taste.service.ts`:
  - `cachedQloo(path, params)`: hash with `qlooRequestHash`; reuse a row whose `expires_at` is in the future; otherwise call `qlooGet`, insert, return `{ cacheId, response, fromCache }`. A concurrent duplicate insert (unique hash) re-reads the winner's row.
  - `fingerprint(venue, settings)`: the domain requests from plan 02's recipe in parallel with `Promise.allSettled`; each domain becomes `{ domain, items: [{ entityId, name, affinity, popularity, tags, receipt: { cacheId, path } }], status }`; a failed or empty domain is kept with its status, never dropped silently.
  - `demographicSkew(venue)`: the method plan 02 chose; output `{ ageBands: [{ band, index, receipt }], gender: [...] }`.
  - Normalisation for scoring: affinities scaled to 0..1 within the fingerprint (pure helper, tested); the raw value stays the receipt.
- `taste.schemas.ts`: `TasteFingerprint` type and the Zod schema for the slice of Qloo responses read (from plan 02's `lib/qloo/schemas.ts`).
- Step writer `modules/runs/runs.steps.ts` (shared with plans 05 to 07, created here): `recordStep(run, step, tool, input)` returns a `finish(outputSummary, cacheId?)`; writes `run_steps` with latency.
- Domains: artists, movies, TV shows, brands, places (filtered to food and drink), books, podcasts, people, tags; video games and destinations only if plan 02 shows data. Target 8 or more with results.
- Radius: the venue's `search_radius_m` (default 2000) applied in the way plan 02 proved (WKT point plus radius, or locality query), recorded in the step input so the trace shows it.

## Screens

- **`TasteFingerprintCard`** (used on the plan page in plan 07 and the demo page in plan 09): a grid of domain tiles (1 column at 390, 2 at 768, 3 at 1280, 4 at 1440). Each tile: domain icon and label, top 5 items with a `MeterBar` for affinity and the value as text, an evidence chip on each value (wired in plan 06; here the chip opens the raw receipt). Empty domain tile: "Not enough data nearby" with an icon, never blank. Demographic skew shown as labelled bars with the values in text.
- Loading: tile skeletons. Partial: failed domains show a small error line with retry.

## Tests

- `cachedQloo`: cache hit makes no network call; expired row refreshes; unique-violation race re-reads (unit, repository and client mocked).
- `fingerprint`: one domain failing still returns the rest with statuses; an empty domain is marked empty; receipts point at real paths in the synthetic response.
- Normalisation helper: min, max, single item, all equal.
- Step writer records latency and the cache id.
- Card renders values as text and keeps meters accessible (`role="meter"` with `aria-valuenow`).

## Build notes (Oct 13)

- Receipts are `text[]` key paths, the same form the evidence trigger reads with `#>>`, so a fingerprint value becomes evidence without conversion.
- Cache history: refreshing an answer in place would have changed values that older evidence quotes. Migration `20261013103000_qloo_cache_history` keeps superseded rows (`superseded_at`), allows one current row per request, and stores answers through `store_qloo_answer` (service role only). Asserted in `rls.sql`. **Applied locally only**: the Supabase MCP has no permission on hack2026 and the CLI is not linked, so the hosted apply, advisors and hosted `rls.sql` run are pending.
- Rate limit: 11 parallel calls hit 429 on the hackathon key. Calls run 3 at a time (`QLOO.maxConcurrent`); no 429 since.
- Schema: some artist tags arrive with only a `type`; tag `id` and `name` are optional so one odd tag cannot fail a domain.
- Quality: artists use a popularity band of 0.3 to 0.7. Below 0.3 was noise (novelty acts, a sports team). Podcasts are uncapped (the cap emptied them). Films and TV keep the cap only, because a floor starved them.
- Names pass `isPresentableName` (`config/content.ts`) before display. One live artist name carried a racial slur. The filter is narrow and tested against real names it must not hide (Niger, Donald Fagen, Kike Pavon).
- Scores come from Qloo's rank, not the affinity value, because affinities cluster at 0.97 to 1.0. The raw affinity stays the receipt and is shown as text.
- The card shows affinity as a value chip, not a `MeterBar`: with every value near 1 the bars would all be full and say nothing. The audience lean is a diverging meter from -1 to 1.
- Opening a chip's receipt arrives with plan 06 (evidence chips). Retrying a failed domain arrives with plan 07 (runs); until then the tile says it is retried on the next run.
- For plan 06: music tags are the sharper signal for concepts. Qloo's artist type also includes visual artists, models and comedians.
- Script runner: `npm run taste:print -- <venueId>` (tsx, pinned).

## Deliverables

- [x] Fingerprint for each demo venue returns 8 or more domains with results, each value with a receipt that resolves (11 of 11 for all three, local database, live Qloo)
- [x] A repeat fingerprint within the freshness window makes no Qloo call (seen in logs and `run_steps`): 12 of 12 from cache in 215 ms, no new cache rows
- [x] Demographic skew present with receipts, or a recorded reason from plan 02 why not
- [x] `read_neighbourhood` writes one `run_steps` row per Qloo call, with latency and cache id
- [ ] `TasteFingerprintCard` meets the Screen standard, including empty and partial domains (built, tested and in the gallery under Taste fingerprint; awaiting the user's check at the four widths)
- [x] Tests above pass with synthetic fixtures only

## Verification

`node --env-file=.env.local scripts/print-fingerprint.ts <venueId>`, then `select count(*), min(fetched_at) from qloo_cache`. Run it twice and confirm the second makes no new rows. `npm run validate`.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly, section 5 (grounding) above all. Read this plan, plan 02's Findings and recipe, `lib/qloo`, `qloo_cache` and `run_steps` in the migrations, and `CLAUDE.md` section 3 for allowed service-role uses.

Order: pure helpers and tests, repository, service and tests, step writer, script, then the card in the gallery from plan 01. Hand-written fixtures only. Run `npm run validate`. Tick boxes only when verified. No long dashes. Do not commit unless asked.
