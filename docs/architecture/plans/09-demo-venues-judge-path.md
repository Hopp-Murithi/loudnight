# Plan 09: Demo venues and the judge path

Status: First pass built and live (sections 1 to 4 and 6). Series and launch kit wait for plans 10 and 11; refresh from the admin console waits for plan 08.
Depends on: 07 (first pass), 10 and 11 (second pass)
Phase: 3 for sections 1 to 4 and 6; phase 4 adds section 5 (series and launch kit) and reruns the precompute
Judging criteria: Design (judge gets a full plan without signing up), Quality of the Idea (the hook: "a normal AI says trivia night")

## Goal

A judge opens the live URL on any device, logged out, and within seconds sees three real neighbourhoods with full plans: the generic answer next to Loudnight's, the trace of how it got there, three concepts with receipts, and a series ready to launch. Nothing is typed in by hand: the real pipeline produced every demo plan ahead of time, and the page says so.

## Brief coverage

Wow feature: "Preloaded demo venues: 3 real US neighbourhoods, results instant, no signup". Engineering: "Speed for judges: demo venues are precomputed and cached; a fresh run on a new address takes about a minute." Demo script 0:00 to 1:35. Submission checklist: "3 preloaded demo venues return results instantly", "Live URL works on desktop and phone, in a logged-out browser". Never cut: preloaded demo venues.

## Scope

In: `scripts/precompute-demo.ts`, demo refresh from the admin console, `/demo/[venueId]` page, landing page demo section linking to it, trace replay, a "Try your own venue" bridge to onboarding, a judge-friendly tour strip, Open Graph image per demo venue.
Out: changes to the pipeline itself.

## Design

- `precompute-demo.ts` (service role, allowed use: demo upkeep): for each demo venue, run all six steps through the same services as plan 07 with `requested_by` null, then choose the top concept and create its series and launch kit (plans 10 and 11) so the demo shows the whole journey. Idempotent: replaces the previous demo run only after the new one succeeds. Logs a summary, never secrets.
- Public read is already allowed by RLS for demo venues (`readable_venue_ids()` includes `is_demo`), through the caller's anonymous client.
- `/demo/[venueId]`: server-rendered from stored data (fast, cacheable with `revalidate` of 1 hour and on-demand revalidation after a refresh).
- Trace replay: the stored `run_steps` replayed client-side with short delays (skippable, instant under reduced motion), labelled "Replay of the run from Oct 20, 14:02".
- Tour strip: three numbered hints along the top ("1. See what a normal AI says", "2. Open a receipt", "3. See the launch kit"), dismissible, remembered in `localStorage` (convenience only).
- Open Graph images per demo venue via `opengraph-image.tsx`, so shared links look finished.

## Screens

- **`/demo/[venueId]`** sections in order, matching the two-minute demo script:
  1. Venue header: name, neighbourhood, quiet night, break-even ("needs 40 people").
  2. Generic vs Loudnight toggle (from plan 07), Generic shown first.
  3. Trace replay (collapsible) and the fingerprint card (plan 04) and gap scan card (plan 05).
  4. Three concept cards with receipts (plan 06), the chosen one marked.
  5. The series calendar and launch kit preview (plans 10 and 11), read only.
  6. "Try it on your own venue" call to action.
  - 390: one column, sticky toggle under the header. 768: two columns where cards pair. 1280 and 1440: trace left, content right, as the plan page.
- Landing demo cards turn into links once a demo plan exists ("Plan ready").
- States: plan not precomputed yet (honest message, link to try your own), stale data older than 14 days (refresh badge for admins only).

## Tests

- Precompute: idempotency (a failed refresh keeps the previous plan), demo-only guard (refuses non-demo venues).
- Page: renders for an anonymous visitor using only RLS-permitted reads (integration test with a fake client); hidden actions (choose, plan again) absent.
- Replay: honours reduced motion (instant) and skip.
- E2E (plan 17): logged-out phone viewport opens each demo venue under 3 seconds on throttled "Fast 4G".

## Deliverables

- [ ] All three demo venues precomputed by the real pipeline, including series and launch kit (plans, series and performers are precomputed on the hosted project, Oct 13; the launch kit waits for plan 11)
- [ ] `/demo/[venueId]` loads for a logged-out visitor in under 3 seconds on a phone profile
- [ ] Generic answer shown first; toggle, receipts, trace replay and launch kit preview all work
- [x] Landing links open ready demos; "Try your own venue" leads to onboarding
- [ ] Refresh from the admin console works and is audited
- [x] Open Graph images render for each demo venue
- [ ] Screen standard met at four widths in both themes

## What changed while building

- The page reads through the visitor's own cookie client, so it is rendered on demand, not cached for an hour. It is still one round of parallel reads.
- The trace replay lives in the Steps tab of "How Loudnight got there", not in its own section, to keep the page to one idea at a time.
- The landing page shows demo venues as a row of links under the five-picture story, not as cards.
- `npm run demo:precompute` runs the upkeep. A failed refresh deletes only the half-made run and keeps the previous plan.

## Verification

Run the precompute against the hosted project (with the user's approval), open each demo venue in a private window on a phone and a laptop, run the E2E judge path.

## Prompt

---

You are working on Loudnight. Follow `CLAUDE.md` exactly. Read this plan, plan 07's services and components, plans 10 and 11 for the series and launch kit read models, and the demo script in the brief.

Order: precompute script with tests, page data loader, page sections reusing existing components, replay, tour strip, Open Graph images. Ask the user before running the precompute against the hosted project. Run `npm run validate`. Check at four widths, both themes, logged out. Tick boxes only when verified. No long dashes. Do not commit unless asked.
