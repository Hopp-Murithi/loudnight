# Plan 24: Plan comparison

Status: Not started (plan written Oct 14)
Depends on: 07
Phase: 5 (stretch, from plan 20 part B)
Judging criteria: Technological Implementation

## Goal

An owner who has planned more than once (another weekday, a wider radius, a few weeks later) sees two plans side by side and what changed between them: which nights came out on top, which tastes are shared and which are new, and what is already on nearby.

## Brief coverage

Plan 20 part B item 2: "compare two runs for the same venue (different weekdays or radii) side by side."

## Scope

In: a list of a venue's finished plans, a comparison page for any two, a pure diff, a link from the plan page.
Out: comparing plans from different venues, merging plans.

## Design

- `modules/compare`: `compare.diff.ts` (pure): given two run views and their shortlists, returns for each side the nights with scores, and three lists per taste domain and for nearby themes: in both, only in the first, only in the second. Names are compared case-insensitively.
- `compare.service.ts`: `listPlans(supabase, venueId)` (finished Loudnight runs, newest first, capped at 12, with the top night's name) and `comparePlans(supabase, venueId, a, b)`, both through the caller's client so RLS decides. A run from another venue is not found.
- Page `/venues/[id]/plan/compare?a=<run>&b=<run>`; with no choice it defaults to the two newest. Owners, managers and door staff may read it, like the plan itself.

## Screens

- **Compare**: two pickers (date and weekday of each plan); under each, its three nights as compact rows with scores; then "Tastes" and "Already on nearby" as three columns: only in the first, in both, only in the second. On a phone the two plans stack and the three columns become three short lists.
- One plan only: an explanation and a "Plan again" button.

## Tests

The diff (shared, only-first, only-second, case, empty domains), the service (venue mismatch is not found, defaults to the two newest).

## Deliverables

- [ ] Any two finished plans of a venue compared side by side
- [ ] Shared and differing tastes and nearby themes shown
- [ ] Reached from the plan page when a venue has two or more plans
- [ ] Screen standard met

## Verification

`npm run validate`; on a venue with two plans, open Compare and switch one of the two.

## Prompt

---

You are working on Loudnight. Follow `CLAUDE.md` exactly. Read this plan and `modules/runs`. Order: the diff with tests, the service with tests, the page. No long dashes. Do not commit unless asked.
