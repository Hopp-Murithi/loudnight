# Plan 07: Pipeline runs, live trace and generic toggle

Status: Built and verified end to end on hosted (Oct 13). Waiting on the UI review; timing above the one-minute target on a fresh area.
Depends on: 06
Phase: 3
Judging criteria: Technological Implementation (multi-step agent, streaming, every Qloo call listed), Quality of the Idea (the toggle shows why Qloo matters), Design (watching it think)

## Goal

A run is something the owner watches. The client drives the six steps in order; each step is its own streamed server call, so nothing approaches the host's time limit. Each step appears as it happens with what it found and its source. A "Generic AI vs Encore" toggle shows the same venue answered by a plain model beside Encore's evidence-backed concepts. A "Powered by Qloo" panel lists every Qloo call in the run, each opening its receipt.

## Brief coverage

"Watch the agent think (about 60 seconds). A live trace shows each step: reading the neighbourhood, checking competitors, generating concepts. Every finding carries its source." "Encore runs a fixed pipeline of six steps, and Claude chooses which tools to call inside each step." "Long runs: each pipeline step is its own server call, driven from the client and streamed." Wow features: "Generic AI vs Encore toggle". Judging proof: "Powered by Qloo panel listing every call in a run". Abuse control: "per-IP rate limits on fresh runs".

## Scope

In: `modules/runs` (create, run step, resume, read), the NDJSON event protocol, `useRun` hook, the plan page `/venues/[id]/plan` and `/venues/[id]/plan/[runId]`, `RunTrace`, `GenericToggle`, `PoweredByQlooPanel`, the generic mode, run cap and per-IP limit messages.
Out: demo precompute and the public demo page (plan 09).

## Design

### Protocol

- `POST /api/v1/venues/[id]/runs` (owner or manager; per-IP limited; the database caps six per person per hour): creates an `encore` run and a `generic` run for the same venue and weekday, returns both ids. The generic run is created with `requested_by` null, so the per-person cap counts plans, not pairs.
- `POST /api/v1/runs/[runId]/steps/[step]` (`apiStreamRoute`, team): runs one step and streams events, one JSON object per line:
  - `{ type: "started", step, at }`
  - `{ type: "tool", step, tool, summary, source: "Qloo" | "Google Places" | "Ticketmaster" | "Claude", receiptId? }`
  - `{ type: "finding", step, text, receiptIds: [] }`
  - `{ type: "done", step, latencyMs }` or `{ type: "error", step, message, retryable }`
- Steps are idempotent: re-running a finished step replays its stored `run_steps` as events without new calls. A step can start only when the previous one succeeded (checked in the service).
- The run's `status` and `current_step` update with the service role at each boundary; `finished_at` set on success or failure.
- The work continues if the reader leaves (stream writes stop quietly, as in UNoN's `createEventStream`), so a reload resumes from stored steps.
- `GET /api/v1/runs/[runId]` returns the run, its steps, and links to concepts.

### Generic mode

- One `AI_MODELS.reasoning` call with only what a plain chatbot would know: venue name, type, city and the slow night, no Qloo, no gap scan, no tools. Prompt `runs.generic-prompt.ts` asks for three event ideas. Stored in `agent_runs.generic_answer`. Runs in parallel with step 1 so it is ready when the concepts are.

### Hook and client

- `useRun(venueId)`: starts or resumes, calls each step through `apiStream`, keeps an event list per step, exposes `status`, `retry(step)`, `cancel()`. All state in the hook; components only render.

## Screens

- **Plan page `/venues/[id]/plan`**: header with venue, weekday and "Plan again" (disabled with the reason when capped).
  - At 390: trace on top (collapsible once done), then the toggle, then concept cards stacked.
  - At 768: trace collapsible panel, concept cards 2-up.
  - At 1280 and 1440: trace in a left column (sticky), concepts in a right area 3-up, Powered by Qloo panel below.
- **`RunTrace`** (`Stepper`): six steps with status icon and text ("Reading the neighbourhood", "Checking what's on nearby"), tool lines with source badges, findings with evidence chips, latency per step. `aria-live="polite"` announces step changes only, not every line. Reduced motion: no pulsing, instant updates.
- **`GenericToggle`**: segmented control "Generic AI" | "Encore". Generic view shows the plain answer in a muted card with the label "No local data used". Encore view shows the concept cards. On desktop a "Side by side" option shows both columns.
- **`PoweredByQlooPanel`**: a list of every Qloo call in the run: endpoint, plain description of parameters, result count, latency, cache hit badge, "Open receipt". Count summary at the top ("14 Qloo calls, 9 from cache").
- States: not started (one-sentence explanation and "Plan my Tuesday"), running, step failed (message, Retry), capped ("You have planned 6 times this hour. Try again at 21:40."), finished.

## Tests

- Service: step ordering enforced; idempotent replay emits stored events and makes no calls; failure marks the run failed with a plain message; status transitions.
- Route: refuses before streaming without a session or for door staff starting a run; validates the step name.
- Event protocol: schema for each event type; `apiStream` handles split chunks (exists).
- Hook: resumes from a half-finished run; retry reruns only the failed step (React Testing Library with a fake `api.ts`).
- Generic prompt receives no Qloo data (unit on the prompt builder).
- Run cap message maps from `EA429`.

## Build notes (Oct 13)

- Migration `20261013102247_run_context_and_start`: `agent_runs.context` (what each step hands the next), `pair_id` linking the generic twin, and an insert policy so owners and managers start runs with their own session (the hourly cap trigger and preview policies apply). Applied locally and on hosted; `rls.sql` passes on both.
- Steps: `POST /api/v1/runs/[runId]/steps/[step]` streams NDJSON (`started`, `tool`, `finding`, `done`, `error`). A step is claimed atomically, so a double click or a second tab cannot run it twice; a step cut off by the host is treated as stale after 120 s and may be taken again. A finished step replays from stored rows with no new calls. Work continues after the reader leaves (`keepAlive`).
- The stream wrapper did not enforce its `rateLimit` option; it does now.
- `useRun` drives the steps in order, merges live lines with the stored run, refetches the run after each step, and retries only the failed step.
- Generic mode sends only name, type, city and night (tested to contain no Qloo data), asks for plain text, and strips markdown and long dashes before storing.
- End to end on hosted (real session, Union Pool): six steps, 48 trace rows, 26 Qloo pairings checked (13 confirmed), every claim with a receipt, generic answer stored, receipts and choosing work, replay made no new rows, an unknown step returns 422. The test account and venue were deleted.
- Quality fix from that run: music tags that are really places ("Usa", "New york") are left out of the fingerprint.
- Gallery: Planning run (trace with a failed step, generic answer, Powered by Qloo).

## Deliverables

- [ ] A fresh run on a new address streams all six steps to three concepts in about a minute (works end to end; 124 s on a never-seen area, of which 22 s is the first Qloo read and 71 s the planner; each step stays under its 120 s limit)
- [x] No request runs longer than one step; reload resumes; a failed step retries alone
- [ ] Generic answer stored and shown; toggle and side by side work at every width (stored and served live; widths await the user's review)
- [x] Powered by Qloo lists every call with cache status and opens receipts
- [x] Run cap and per-IP limit give plain messages with the time to retry
- [ ] Screen standard met for the plan page in all states

## Verification

`npm run validate`, `npm run db:test`. Onboard a new Brooklyn address in a private window, plan it, reload mid-run, kill the network for one step and retry, toggle generic, open three receipts from the panel.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read this plan, `lib/http/stream.ts`, `apiStreamRoute`, `apiStream`, the services from plans 04 to 06, the UNoN reference `../UNoN-hackathon/src/modules/assistant` for streaming patterns, and plan 01's `Stepper`. Load the `claude-api` skill for the generic prompt.

Order: event schemas and tests, run service with step dispatch and idempotency, routes, generic mode, hook with tests, then the page and components. Run `npm run validate` and `npm run db:test`. Check the page at four widths in both themes, with reduced motion, and with the network throttled. Tick boxes only when verified. No long dashes. Do not commit unless asked.
