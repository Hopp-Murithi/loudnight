# Plan 02: Qloo probe and integration correctness

Status: Not started
Depends on: 00
Phase: 1 (the day-one gate)
Judging criteria: Technological Implementation (how thoroughly and skilfully the project uses Qloo)

## Goal

Before any pipeline code, prove with live calls which Qloo requests return rich data for three US neighbourhoods, record the exact parameters and response paths that work, and harden `lib/qloo` around them: correct base URL and header, retries on rate limits, empty-result detection, and Zod schemas for exactly the fields Encore reads. Settle the hackathon's eligibility questions on the same day.

## Brief coverage

"Exact Qloo parameters (entity types, location filters, demographic outputs) get confirmed in the day-1 API test before the pipeline is coded." "If the day-1 gate fails, switch neighbourhoods or lean on interest signals." Risks: "Qloo location data thin", "Qloo rate limits or slow API key approval", "Kenya not eligible". Submission requirement: "Confirm eligibility for residents of Kenya, how prizes are paid, whether work must start after Sep 30, and how Qloo API access is granted".

## What the official docs already confirm

From the Qloo hackathon developer guide and docs.qloo.com (read Oct 12):

- Base URL `https://hackathon.api.qloo.com`. Hackathon keys return 401 on staging or production URLs.
- Key in the `X-Api-Key` header. Never a query parameter or Bearer token.
- `GET /v2/insights` with parameters in the query string. A POST with a JSON body fails. `/recommendations` and `/recs` are legacy and unsupported.
- `filter.type` is required. Valid values: `urn:entity:artist`, `book`, `brand`, `destination`, `movie`, `person`, `place`, `podcast`, `tv_show`, `video_game`, plus `urn:tag` and `urn:heatmap`. Music is `urn:entity:artist`; food and drink is `urn:entity:place` or `urn:entity:brand`. A 403 means an unsupported type.
- Location: `signal.location` takes a WKT `POINT(longitude latitude)`, a polygon, or a locality id; `signal.location.radius` is in metres (max 800000), and the docs advise against it because it overrides dynamic density discovery; `signal.location.query` takes a locality name. Place and destination types also take `filter.location` (`lat,lng`, WKT or id) and `filter.location.radius` (metres, default 15000).
- Demographic signals: `signal.demographics.age`, `signal.demographics.gender`, `signal.demographics.audiences` (valid audience URNs only).
- Interests: `signal.interests.entities` (Qloo entity ids from `/search`) and `signal.interests.tags` (tag ids from `/v2/tags`). Free text is not a valid tag. "At least one valid signal or filter is required" means an invalid tag or audience.
- Paging: `take` default 20, max 50; `page` 1 to 100. `filter.popularity.min` and `.max` are 0 to 1. `bias.trends` exists on entity types. `feature.explainability=true` adds per-result input contributions under `query.explainability`.
- **Invalid parameters are ignored silently.** An empty `entities` array with 200 OK usually means a parameter is not valid for that `filter.type`, not missing data.
- `/search`: `query`, `types` (comma separated), `filter.location`, `filter.radius` in **miles** (0 to 100), `sort_by` (`match`, `distance`, `popularity`), `take` under 200, 404 when nothing matches, 429 when rate limited.
- Quotas: rate and monthly limits, raised on request in Discord `#api-help`. Keys stay active through judging.
- Caching: private server-side caching is allowed with no time limit. **Qloo response data must never be stored in a public repository.**

## What the probe must settle (not documented, or documented inconsistently)

1. Whether `signal.location` with a WKT point works for each entity type on the hackathon host, or whether `signal.location.query` (locality name) is the reliable form. Compare result counts for both, with and without `signal.location.radius`.
2. The response field names Encore needs: the entity id, name, type, the affinity score (expected under `query.affinity`), popularity, tags, and image. Record the exact JSON paths for the receipt trigger.
3. Whether `filter.type=urn:tag` with a location signal returns the area's over-indexing tags (the "taste analysis" view), and with which tag types.
4. How to get the area's demographic skew: try `urn:demographics` if accepted, otherwise compare affinities under `signal.demographics.age` bands and genders for the same location, and record which works.
5. `/v2/tags` parameters and response paths (the docs page for it moved; confirm live).
6. Valid audience URNs for `signal.demographics.audiences` (list endpoint, if any).
7. Latency per call, and the rate limit headers or 429 behaviour.
8. Whether `urn:heatmap` adds anything useful for "where in the neighbourhood" (optional, for the fingerprint card).

## Design

- `scripts/qloo-probe.ts` (run with `node --env-file=.env.local scripts/qloo-probe.ts`). For Williamsburg (`POINT(-73.9575 40.7174)`), East Austin (`POINT(-97.7296 30.2624)`) and Logan Square (`POINT(-87.7086 41.9292)`): every entity type above with each location form, `urn:tag`, the demographic options, `/search` for a known artist, `/v2/tags` for "afrobeats". It prints a table: type, form, HTTP status, result count, latency, first result's top-level keys and the affinity path. It writes full responses to `.probe/` (git-ignored) for reading locally. Nothing from `.probe/` is ever committed.
- Add `.probe/` to `.gitignore` and `.prettierignore`.
- Findings go into the "Findings" section of this plan as a table, plus the chosen request recipe per domain.
- `lib/qloo/client.ts` hardening:
  - `qlooGet` treats `success: false` and 4xx as `upstreamFailed("Qloo")`; logs status and path only.
  - On 429, one retry after the `Retry-After` header or 1 second, then fail.
  - `qlooSearch(query, types, near?)` for `/search`, with miles converted from metres in one tested helper.
  - `qlooTags(query, types?)` for `/v2/tags`.
  - Typed request builders per domain in `lib/qloo/requests.ts` (pure, tested), so no service ever hand-writes parameter names.
  - `lib/qloo/schemas.ts`: Zod for the fields Encore reads (from the findings), with `passthrough` so the stored response stays whole.
  - `isEmptyInsight(response)` helper so the fingerprint can tell "no data here" from an error.
- `scripts/check-connections.ts` uses the recipe the probe proved.
- Eligibility: read the official rules on Devpost (qloo.devpost.com) and record in this plan: eligibility for residents of Kenya, prize payment method, the start-date rule, the licence requirement. If anything is unclear, draft a question for the Devpost discussion or Discord for the user to post.

## Findings

To be filled in by the probe run: one row per domain and location form, then the chosen recipe.

| Domain | Request recipe | Areas with 10+ results | Affinity path | Latency p50 |
| ------ | -------------- | ---------------------- | ------------- | ----------- |
|        |                |                        |               |             |

Gate decision: (pass, or which areas or signals to switch to)

Eligibility: (Kenya, prizes, start date, licence)

## Tests

- Request builders produce exactly the documented parameter names per domain (unit, table driven).
- Metres to miles conversion for `/search` (unit).
- `qlooGet`: 401, 403, 429 then success, 429 twice, `success: false`, and an empty `entities` array, each mapped correctly (unit with a stubbed `fetch`).
- Schemas accept a synthetic response shaped like the findings and reject a missing affinity (unit). Fixtures are hand written.

## Deliverables

- [ ] `.probe/` ignored by git and Prettier
- [ ] Probe run against all three neighbourhoods; Findings table filled in
- [ ] Gate decision recorded: at least 8 domains with 10 or more results in at least two areas, or the switch decided with the user
- [ ] Demographic skew method chosen and recorded
- [ ] `lib/qloo` hardened as designed, with tests; `check:connections` uses the proven recipe
- [ ] Eligibility, prize payment, start-date rule and licence recorded from the official rules
- [ ] No real Qloo response committed anywhere (`git grep` for a known entity id from the probe returns nothing tracked)

## Verification

`node --env-file=.env.local scripts/qloo-probe.ts`, `npm run check:connections`, `npm run validate`, `git status` shows `.probe/` untracked and ignored.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read this plan, `lib/qloo`, `lib/http/upstream.ts`, `config/integrations.ts`, and the "What the official docs already confirm" section above. If a live call contradicts this plan, the live call wins: update the plan.

Ask the user for `QLOO_API_KEY` if it is not in `.env.local`. Never print it. Write the probe, run it, fill in Findings, then stop and show the user the findings and the proposed gate decision before hardening the client. Then harden `lib/qloo` with tests using hand-written fixtures only. Read the official rules on qloo.devpost.com for the eligibility items. Run `npm run validate`. Tick boxes only when verified. No long dashes. Do not commit unless asked.
