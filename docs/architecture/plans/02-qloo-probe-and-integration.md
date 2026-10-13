# Plan 02: Qloo probe and integration correctness

Status: Done (Oct 13)
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

Probe run Oct 13 (`scripts/qloo-probe.ts`, then `--refine`): 151 calls against Williamsburg, East Austin and Logan Square. p50 712ms, p95 4.5s. No 429 seen. Full responses stayed in `.probe/`.

| Domain                       | Request recipe                                                                                              | Areas with 10+ results                   | Affinity path                                | Latency p50               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------- | ------------------------- |
| Music                        | `filter.type=urn:entity:artist`, `signal.location=POINT(lng lat)`                                           | 3 of 3                                   | `$.results.entities[i].query.affinity`       | 0.8s                      |
| Books                        | `urn:entity:book`, same                                                                                     | 3 of 3                                   | same                                         | 0.7s                      |
| Brands (food, drink, retail) | `urn:entity:brand`, same                                                                                    | 3 of 3                                   | same                                         | 1.0s                      |
| Destinations                 | `urn:entity:destination`, same                                                                              | 3 of 3                                   | same                                         | 0.6s                      |
| Film                         | `urn:entity:movie`, same                                                                                    | 3 of 3 (Logan Square 7 without radius)   | same                                         | 0.7s                      |
| People                       | `urn:entity:person`, same                                                                                   | 3 of 3                                   | same                                         | 1.1s                      |
| Places (taste)               | `urn:entity:place`, `signal.location` alone                                                                 | 3 of 3                                   | same                                         | 1 to 21s, too slow        |
| Places (nearby)              | `urn:entity:place`, `filter.location=POINT(lng lat)`, `filter.location.radius=2000`, plus `signal.location` | 3 of 3, every result inside 2 km         | same                                         | 0.6s (3s with the signal) |
| Podcasts                     | `urn:entity:podcast`, same                                                                                  | 3 of 3                                   | same                                         | 0.6s                      |
| TV                           | `urn:entity:tv_show`, same                                                                                  | 3 of 3                                   | same                                         | 0.7s                      |
| Tags (area's tastes)         | `filter.type=urn:tag`, `filter.tag.types=urn:tag:genre:music` (or `urn:tag:genre:place`), `signal.location` | 3 of 3                                   | `$.results.tags[i].query.affinity`           | 0.9s                      |
| Who loves a taste            | `filter.type=urn:demographics`, `signal.interests.tags=<tag id>`                                            | 1 row, age bands and gender from -1 to 1 | `$.results.demographics[0].query.age.<band>` | 0.6s                      |
| Where in the area            | `filter.type=urn:heatmap`, `filter.location=POINT(...)`, `signal.interests.tags=<tag id>`                   | 139 to 448 cells                         | `$.results.heatmap[i].query.affinity_rank`   | 1.1s                      |
| Search                       | `/search?query=&types=`                                                                                     | 5 of 5                                   | none                                         | 0.9s                      |
| Tag lookup                   | `/v2/tags?filter.query=` (optionally `filter.tag.types`)                                                    | 4 to 5                                   | none                                         | 0.6s                      |
| Audiences                    | `/v2/audiences?filter.audience.types=urn:audience:<type>`; types from `/v2/audiences/types`                 | 4 to 10                                  | none                                         | 0.6s                      |

What the live calls showed, against the docs:

- `signal.location` with a WKT point works for every supported type. `signal.location.query` (locality name) is unreliable: 0 entities for artist, brand and place in Williamsburg, and for almost every type in East Austin. Encore uses the WKT point only.
- `signal.location.radius` changed nothing: identical results with and without it. Encore leaves it out, as the docs advise.
- `filter.location` needs WKT. `lat,lng` returns 400 "WKT format is invalid".
- `urn:entity:video_game` is not supported on the hackathon host (400). `urn:demographics` needs `signal.interests.tags` or `.entities` (400 without).
- Affinity saturates. The top results all sit at 1.0, and the most popular ones are the same in every city (global stars). Two fixes: `filter.popularity.max=0.7` brings up the local names (East Austin: Walker Lukens, Mobley, Jackie Venson), and tags differ clearly by area (East Austin: alt-country, americana, blues; Williamsburg: indie, experimental; Logan Square: chicago, comedy). So the fingerprint reads tags plus popularity-capped entities, and ranks by position. Receipts still point at the stored affinity value.
- `bias.trends=high` lowers every affinity to the same 0.76 without changing the order much, so it is not useful here.
- `filter.tags=urn:tag:genre:place:bar` returned 0 results. Tag ids must come from `/v2/tags`, never be guessed.
- Places carry what the gap scan needs: `properties.live_music`, `good_for`, `event_spaces`, `hours`, `price_level`, plus tags for ambience, time of day and category.
- Place insights with only `signal.location` took 10 to 21 seconds, longer than the 15 second client timeout. With `filter.location` they take under a second.

Gate decision: **pass**. Nine domains (artist, book, brand, destination, movie, person, place, podcast, TV) plus tags return 20 results in all three areas. No neighbourhood switch needed.

Demographic skew method: `urn:demographics` for each of the concept's driving tags gives age and gender lean. Location does not change it, so it describes a taste's audience, not the area. The area's own taste comes from tags and capped entities around the point.

Eligibility (qloo.devpost.com/rules, read Oct 13): open to individuals of the age of majority. Excluded: Brazil, Quebec, Russia, Crimea, Cuba, Iran, North Korea and countries comprehensively sanctioned by OFAC. Kenya is not excluded. Prizes are paid to the entrant within 60 days of the winner forms, and the winner pays any fees. Projects must be new or significantly updated after Sep 30, 2026 9:00 am ET. Encore was started Oct 12. Licence: the repository must be public with an open source licence file visible in the About section (MIT). Submissions close Oct 30, 2026 11:45 pm ET. Judging Nov 2 to 16, winners around Nov 23. Required: a working demo link, a public repository and a text description. The rules set no video length.

## Tests

- Request builders produce exactly the documented parameter names per domain (unit, table driven).
- Metres to miles conversion for `/search` (unit).
- `qlooGet`: 401, 403, 429 then success, 429 twice, `success: false`, and an empty `entities` array, each mapped correctly (unit with a stubbed `fetch`).
- Schemas accept a synthetic response shaped like the findings and reject a missing affinity (unit). Fixtures are hand written.

## Deliverables

- [x] `.probe/` ignored by git and Prettier
- [x] Probe run against all three neighbourhoods; Findings table filled in
- [x] Gate decision recorded: at least 8 domains with 10 or more results in at least two areas, or the switch decided with the user
- [x] Demographic skew method chosen and recorded
- [x] `lib/qloo` hardened as designed, with tests; `check:connections` uses the proven recipe
- [x] Eligibility, prize payment, start-date rule and licence recorded from the official rules
- [x] No real Qloo response committed anywhere (`git grep` for a known entity id from the probe returns nothing tracked)

## Verification

`node --env-file=.env.local scripts/qloo-probe.ts`, `npm run check:connections`, `npm run validate`, `git status` shows `.probe/` untracked and ignored.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read this plan, `lib/qloo`, `lib/http/upstream.ts`, `config/integrations.ts`, and the "What the official docs already confirm" section above. If a live call contradicts this plan, the live call wins: update the plan.

Ask the user for `QLOO_API_KEY` if it is not in `.env.local`. Never print it. Write the probe, run it, fill in Findings, then stop and show the user the findings and the proposed gate decision before hardening the client. Then harden `lib/qloo` with tests using hand-written fixtures only. Read the official rules on qloo.devpost.com for the eligibility items. Run `npm run validate`. Tick boxes only when verified. No long dashes. Do not commit unless asked.
