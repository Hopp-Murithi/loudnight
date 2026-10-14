# Plan 14: Learning loop

Status: Not started
Depends on: 13
Phase: 4 (light, as the brief says; first on the cut-list: keep check-in counts, drop the automatic adjustment)
Judging criteria: Quality of the Idea (closes the loop: decide, execute, promote, measure, improve), Potential Impact (stops good ideas being dropped too early and bad ones running too long)

## Goal

After each night, Loudnight compares turnout with the break-even target and recommends what to do with the next date in the series: keep it, tweak it, or swap the concept. The manager confirms with one tap; a tweak rewrites the next night's variation and launch kit grounded in the same fingerprint; a swap moves the series to the next shortlisted concept. Every decision is recorded, building the outcome data the brief calls the moat.

## Brief coverage

"Learn. After each night Loudnight compares turnout with the break-even target and adjusts the next date: keep, tweak or swap the concept." Feature table: "Learning loop: check-ins vs break-even adjust the next date (light)." "For the learning loop: the next date in the series adapts to what actually happened." "For the business: a growing record of which concepts filled seats in which kinds of neighbourhoods." Cut-list item 1.

## Scope

In: decision rules, recommendation card, confirm action, tweak (variation and kit regeneration for the next night), swap (series moves to concept rank 2 or 3), decision history, an outcomes view for administrators aggregating concept format against turnout.
Out: machine learning on outcomes (roadmap note in plan 20).

## Design

- Rules (pure `learning.rules.ts`, tested): ratio = people checked in divided by break-even. At or above 1.0: keep. From 0.6 to below 1.0: tweak. Below 0.6: swap if another shortlisted concept exists, else tweak. A night with no check-ins recorded and no RSVPs is "not measured" and recommends nothing.
- Recommendation appears from the night's end time plus two hours, or when the manager opens Results.
- `POST /api/v1/nights/[id]/decision` (owner, manager): `{ decision: keep | tweak | swap }` sets `decision` and `decided_at` (the existing check constraint keeps them together), then:
  - keep: nothing else changes.
  - tweak: `AI_MODELS.copy` proposes a new variation for the next night using what happened (counts only) and the fingerprint; the manager reviews before it replaces the old one; the next night's kit is regenerated on request.
  - swap: the next unpublished nights move to a new series for the next shortlisted concept (a database function, `security invoker`, atomic), with a clear explanation.
- Outcomes view (admin): concept format, neighbourhood, nights run, average ratio. Stored only as aggregates of existing rows; no new personal data.

## Screens

- **Recommendation card** on the Results tab and the venue overview: the ratio as text and meter ("31 of 40, 78%"), the recommendation with a one-sentence reason, Confirm and "Choose differently". Decided nights show the decision badge and time.
- Tweak review sheet: old and new variation side by side (stacked on phones), Accept or Keep old.
- Swap confirmation dialog listing what changes (which dates move, what stays published).

## Tests

- Rules at boundaries 0.59, 0.6, 0.99, 1.0, no shortlist left, not measured.
- Decision route: role checks, idempotency (second decision refused), constraint pairing.
- Swap function: atomic, only unpublished nights move (`rls.sql` or a new `supabase/tests/learning.sql`).
- Tweak prompt receives counts only, never guest data.

## Deliverables

- [ ] Recommendation shown after each measured night with its reason
- [ ] Keep, tweak and swap work and are recorded with time and actor (audit)
- [ ] Tweak never changes a published night without review
- [ ] Swap is atomic and explained
- [ ] Outcomes view for administrators
- [ ] Screen standard met for the card, sheet and dialog

## Verification

`npm run validate`, `npm run db:test`; simulate a night at 31 of 40 (tweak), one at 45 of 40 (keep), one at 12 of 40 (swap) on the local stack and walk through each.

## Prompt

---

You are working on Loudnight. Follow `CLAUDE.md` exactly. Read this plan, plans 10, 11 and 13, and the `event_nights.decision` constraint. Load the `claude-api` skill for the tweak prompt and the `supabase-postgres-best-practices` skill for the swap function.

Order: rules with tests, swap function with database tests, services and routes, UI. If the schedule is tight, ship the recommendation and the recorded decision first and leave tweak and swap automation for last, as the brief's cut-list says. Run `npm run validate` and `npm run db:test`. Tick boxes only when verified. No long dashes. Do not commit unless asked.
