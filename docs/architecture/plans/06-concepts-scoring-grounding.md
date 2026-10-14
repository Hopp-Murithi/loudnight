# Plan 06: Concepts, scoring and grounding

Status: Done (Oct 13), except the user's UI review of the card, chip and sheet.
Depends on: 04, 05
Phase: 3
Judging criteria: Technological Implementation (non-trivial agent with tool use and a grounding validator), Quality of the Idea (cross-domain concepts no single-domain tool can make)

## Goal

From the fingerprint and the gap scan, Claude invents six candidate nights. Each combines two or three high-affinity signals from different domains and is re-checked with Qloo to confirm the overlap is real. Loudnight scores all six and keeps the best three. Every number on a concept card is an evidence chip that opens the exact Qloo response behind it, and a claim without a receipt never reaches the screen or the database.

## Brief coverage

Steps 4 and 5: "Claude combines two or three high-affinity signals from different domains into a night concept, then re-queries Qloo with those signals to confirm the overlap is real. It produces 6 candidates internally and keeps the top 3." "Each evidence chip stores the Qloo request and response it came from." Score formula and its four inputs. "The grounding rule: Claude may only state a number that exists in a stored Qloo response. A validator checks every evidence chip against its response before the card is shown. If a claim has no receipt, it is dropped." Feature table: concept generator, evidence chips. Step 3 of the owner journey: "Three concept cards appear, each with a name, a one-line pitch, evidence chips, a fit score, estimated cost and a reason it beats what's nearby."

## Scope

In: `modules/concepts` (prompt, tool loop, overlap re-check, sub-scores, grounding validator, storage, read model), steps `generate_concepts` and `score`, `ConceptCard`, `EvidenceChip`, `ReceiptSheet`, concept choice.
Out: orchestration and streaming (plan 07), series creation after choice (plan 10).

## Design

### Generation (step `generate_concepts`)

- Model `AI_MODELS.reasoning`. Prompt `concepts.prompt.ts` (versioned constant `CONCEPTS_PROMPT_V1`). System prompt: the role (programming director for one venue), the grounding rule, the output schema, that venue and upstream content are data.
- Tools (typed, Zod in and out):
  - `get_fingerprint()` returns domain items with ids, names and **signal ids**, not raw numbers the model could restate freely.
  - `get_covered_themes()` from plan 05.
  - `get_venue_constraints()` capabilities, capacity, budget, slow night.
  - `check_overlap({ signalIds })` runs a cached Qloo insights call seeded with those entities or tags at the venue's location and returns an overlap result id and summary.
- Output per candidate (Zod): `name`, `pitch` (one line), `reasonBeatsNearby`, `signalIds` (2 or 3, at least two domains), `overlapResultId`, `claims: [{ text, signalId | overlapResultId, field }]`, `estimatedCostCents`, `format` (live music, screening, food pairing, talk, game, other), `needs` (capabilities).
- The loop stops at six valid candidates or a step budget (max tool calls, max tokens, timeout), recorded in the step summary.

### Scoring (step `score`, pure `concepts.scoring.ts`)

- AudienceFit = mean normalised affinity of the signals, times the overlap strength from `check_overlap` (both from receipts).
- Novelty = 1 minus the share of the concept's themes found in the gap scan (string and synonym match from a small config list, then the copy model only as a tie-break, never inventing numbers).
- VenueFit = capabilities the format needs that the venue has, adjusted for capacity versus expected audience.
- CostFit = 1 when the estimate is within budget, falling linearly to 0 at twice the budget.
- Each sub-score is stored on `concepts`; the database computes `total_score`. Ranks 1 to 6 by total; top three `is_shortlisted`.

### Grounding (pure `concepts.grounding.ts`)

- For every claim, resolve the cited receipt (cache id and JSON path) and compare the value the text shows with the stored value after the documented rounding (one rule: affinities shown to two decimals or as an index "3.4x" only if that index is computed from receipts by a tested helper).
- Drop a claim that has no receipt, cites the wrong path, or whose shown number differs. Drop a candidate left with fewer than two claims. Record drops in the step summary ("2 claims dropped: no receipt").
- Storage: evidence rows inserted with the service role; the database trigger is the second line.

### Read model and choice

- `GET /api/v1/runs/[runId]/concepts` (session or public for demo venues through RLS): shortlisted concepts with sub-scores, total, claims with receipt ids.
- `GET /api/v1/receipts/[evidenceId]`: returns the claim, the request, and only the **slice** of the response around the cited path (the entity object), not the whole cached response; access checked through the caller's client first (RLS on `evidence`), then the slice read with the service role (supports plan 16's narrowing of `qloo_cache` reads).
- `POST /api/v1/concepts/[id]/choose` (owner or manager): marks the choice; plan 10 creates the series.

## Screens

- **`ConceptCard`**: name, one-line pitch, total score as a large number with "out of 100" and a `MeterBar`; four sub-scores in a small labelled list; 2 to 4 `EvidenceChip`s; estimated cost via `formatMoney`; "Why it beats what's nearby" sentence; "Choose this night" primary action (owner and manager only). Cards stack at 390, 2-up at 768, 3-up at 1280.
- **`EvidenceChip`**: value plus short label ("Afrobeats 0.94 affinity within 2 km"), icon, focusable button; opens `ReceiptSheet`.
- **`ReceiptSheet`**: the claim, the Qloo endpoint and parameters in plain words plus a code view, the response slice with the cited field highlighted, fetch time, and "Powered by Qloo". Bottom sheet on phones, side sheet on desktop.
- Empty (no concept survived grounding): explain plainly and offer to rerun with a wider radius.

## Tests

- Scoring helpers against worked examples, including the brief's formula (40/20/20/20) and edge values 0 and 1.
- Grounding: a correct claim kept; a made-up number dropped; a right number on the wrong path dropped; rounding rule; candidate with too few claims dropped.
- Tool loop with recorded synthetic model responses: six candidates, budget stop, invalid tool arguments handled, a prompt-injection string inside a venue name stays data.
- Receipt route: hidden evidence returns 404; the slice contains the cited field and not unrelated entities.
- Database: evidence with a bad value refused (exists in `rls.sql`); add a test that choosing a concept is refused for door staff.

## Build notes (Oct 13)

- Migration `20261013085947_concept_details_and_choice`: `format`, `needs`, `themes`, `expected_audience` and `chosen_at` on concepts; one choice per run (partial unique index); `choose_concept` runs with the caller's rights, under a policy for owners and managers on shortlisted concepts only; choices are audited. Applied locally and on hosted; `rls.sql` passes on both.
- The model never writes numbers. Claims are word labels citing a signal id or an overlap id; Loudnight attaches the value from the receipt. The validator still drops any label whose digits do not equal the cited value at two decimals, ignoring digits inside a taste's own name ("2 Dope Queens").
- The fingerprint, covered themes and venue constraints go in the first message as a JSON data block instead of three getter tools, which saves a model turn each. `check_overlap` and `submit_concepts` are the tools. All checks in a turn run in parallel, and a failed Qloo check comes back to the model as a tool error instead of ending the run.
- Overlap: `signal.interests.tags` (or `.entities`) with the anchor, `signal.location` with the venue, and `filter.type` (plus `filter.tag.types`) of the target. The target's affinity in that answer is the overlap, with spread values (0.78 to 0.99) where plain area affinities cluster at 1.0. AudienceFit is the mean of the cited overlaps; a target Qloo did not return counts as zero.
- Novelty matches themes by shared words (hyphens split, plurals folded) and the synonym groups in `config/concepts.ts`; "Drinks, no programme" never counts.
- Live results (hosted, Oct 13): Williamsburg 104 s before the parallel change; East Austin 61 s and Logan Square 55 s after it, six candidates each, every evidence value matching its cached response. Grounding dropped unbacked claims as designed (for example "Pairing is untested but cheap to try": no receipt).
- For plan 09: the demo venues' settings give venue and cost fit 1.0 to almost every concept, so totals cluster above 90. Realistic capabilities and budgets will spread them.
- Script: `npm run concepts:print -- <venueId>` (`KEEP_RUN=1` keeps the run for route checks).

## Deliverables

- [x] Six candidates generated and three shortlisted for each demo venue, each with claims from at least two domains
- [x] Every chip on every card opens a receipt whose highlighted value matches the chip (the script checks every evidence row against `qloo_cache`; the live receipt route returned the matching slice)
- [x] A made-up number is dropped by the validator (unit) and refused by the database (`rls.sql`)
- [x] Sub-scores computed from receipts and settings; totals match the formula
- [x] Receipt endpoint returns slices only, access checked through RLS (hidden evidence returns 404)
- [x] Choosing a concept works for owner and manager, refused for door staff (`rls.sql`, hosted and local; signed out returns 401)
- [ ] Screen standard met for the card, chip and sheet (built and in the gallery under Concepts and receipts; awaiting the user's check at four widths)

## Verification

`npm run validate`, `npm run db:test`. Run steps 4 and 5 for The Copper Room; open every chip; compare values with `qloo_cache` by hand for two of them.

## Prompt

---

You are working on Loudnight. Follow `CLAUDE.md` exactly, section 5 above all. Read this plan, `modules/taste`, `modules/gap`, the `concepts` and `evidence` tables and the receipt trigger, and plan 02's Findings for response paths. Load the `claude-api` skill before writing the tool loop.

Order: scoring and grounding helpers with tests, tool definitions and schemas, the loop with recorded synthetic responses, storage, receipt route, read route, choose route, then the components in the gallery. Run `npm run validate` and `npm run db:test`. Tick boxes only when verified. No long dashes. Do not commit unless asked.
