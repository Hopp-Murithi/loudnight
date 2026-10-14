# Plan 25: "Why this works"

Status: Not started (plan written Oct 14)
Depends on: 10
Phase: 5 (stretch, from plan 20 part B)
Judging criteria: Technological Implementation, Quality of the Idea

## Goal

For each performer on the shortlist, Loudnight shows which of the night's tastes drove the match and by how much, using Qloo's own explanation of its answer, with the receipt one tap away. "Very strong crowd match" stops being a single number and becomes "mostly because of Ambient, partly Lounge".

## Brief coverage

Plan 20 part B item 3: "use `feature.explainability=true` from Qloo to show which inputs drove each affinity, with receipts."

## Scope

In: asking Qloo for explanations on the talent request, storing each act's drivers in its profile, showing them on the contact sheet and in the receipt.
Out: explanations for the neighbourhood fingerprint (single-signal requests have nothing to explain), re-explaining acts stored before this plan (a fresh "Look again" fills them in).

## Design

- `talentRequest` adds `feature.explainability=true`. The answer then carries, per act, a contribution for each input tag or entity under `query.explainability`. The exact shape is read with a live probe before the reader is written, and the reader accepts only what it recognises.
- `talent.profile.ts`: `driversFrom(entity, anchors)` returns up to three `{ name, share }` pairs, where `share` is that input's part of the total contribution, rounded to two places. Names come from the anchors Loudnight sent, never from the model.
- Stored inside `talent_candidates.profile.drivers`. No migration: the profile is already a JSON object.
- The receipt for an act already shows the act's whole object from the stored answer, so the explanation is inside the receipt with no extra work.

## Screens

- **Contact sheet**: a "Why they fit" block above the message: one bar per driver with its name and share, and a line saying where the numbers come from. Hidden when there are no drivers.

## Tests

`driversFrom` with a synthetic entity (shares sum to one, unknown inputs ignored, missing explanation gives none), the request builder, the service storing drivers.

## Deliverables

- [ ] The talent request asks Qloo for explanations
- [ ] Each act's drivers are stored and shown, with the receipt holding the same values
- [ ] Nothing is shown when Qloo gives no explanation

## Verification

`npm run validate`; "Look again" on a real venue, open an act, compare the bars with the receipt.

## Prompt

---

You are working on Loudnight. Follow `CLAUDE.md` exactly. Read this plan, plan 02's findings and `modules/talent`. Probe one real answer first (output to `.probe/`, never committed). Fixtures are synthetic. No long dashes. Do not commit unless asked.
