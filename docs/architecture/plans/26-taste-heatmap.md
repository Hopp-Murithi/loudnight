# Plan 26: Taste heatmap

Status: Not started (plan written Oct 14)
Depends on: 04, 07
Phase: 5 (stretch, from plan 20 part B)
Judging criteria: Design

## Goal

On a plan's Taste tab, a small map shows where around the venue the neighbourhood's leading taste is strongest, so an owner can see whether their crowd is on the doorstep or a walk away, and where a flyer would do the most good.

## Brief coverage

Plan 20 part B item 4. Plan 02 found `urn:heatmap` answers with 139 to 448 cells for a tag near a point, so the condition in the brief is met.

## Scope

In: one Qloo heatmap call per plan on first view (cached like every Qloo answer), a drawn map with no map tiles, its receipt.
Out: a real street map (would need a tile provider and a new CSP origin), heatmaps per night or per act.

## Design

- `modules/heatmap`: `heatmap.cells.ts` (pure): turns Qloo cells into points placed in metres east and north of the venue, keeps those within the plan's radius plus a margin, and scales strength from `affinity_rank` to zero to one. `heatmap.service.ts`: reads the run through the caller's client (RLS first), takes the leading music style from its fingerprint, asks Qloo through `cachedQloo`, returns `{ taste, cells, radiusMetres, cacheId }`.
- `GET /api/v1/runs/[runId]/heatmap`: public like the other run reads so demo plans work, rate limited, because a first view costs one Qloo call.
- The map is an SVG: a compass, a ring at the search radius with its distance, a dot for the venue, and one square per cell whose opacity is its strength. No number is printed on the map itself; the strongest direction is said in words, and the receipt button opens the stored call.

## Screens

- **Taste tab**, under the domain tiles: "Where it is strongest" with the map on the left and two lines of reading on the right (which taste, which direction is strongest). Loading shows a skeleton the same size; a failure shows a retry; no cells shows "Not enough data to map this taste here".
- The map has a text alternative: `role="img"` with a label that says the same thing as the sentence.

## Tests

Cell placement (north and east signs, distance), the radius filter, strength scaling, the strongest direction, the service (RLS not found, picks the leading music style, empty answer).

## Deliverables

- [ ] The Taste tab shows the map for a real plan, with a receipt
- [ ] Demo plans show it without an account
- [ ] Designed loading, empty and failed states
- [ ] Screen standard met

## Verification

`npm run validate`; open a real plan's Taste tab and a demo plan's.

## Prompt

---

You are working on Loudnight. Follow `CLAUDE.md` exactly. Read this plan, plan 02's findings on heatmaps, `lib/qloo/requests.ts` and `modules/taste`. Fixtures are synthetic. No long dashes. Do not commit unless asked.
