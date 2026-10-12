# Plan 10: Series planner and talent finder

Status: Not started
Depends on: 06
Phase: 4
Judging criteria: Design (every step ends in something to approve, edit or send), Potential Impact (paid gigs for local performers), Technological Implementation (Qloo entity search and popularity)

## Goal

Choosing a concept turns it into a four-week series on a calendar, each week with its own variation so regulars keep coming back. Encore shortlists performers whose fans overlap this audience at a bookable popularity tier, explains why each fits with receipts, and drafts a personal outreach message for each. The owner can edit dates, variations and messages before anything goes out.

## Brief coverage

"Review the series plan. The chosen concept becomes 4 weekly dates on a calendar, each with a variation so regulars keep coming back." "Book talent. Encore shortlists performers whose fan base overlaps this audience, at the right popularity tier, and drafts a personal outreach message for each." Feature table: 4-week series calendar; talent finder and outreach. Risk: "Talent suggestions are famous, not bookable: filter to lower popularity tiers; frame as acts this crowd loves, book a local act in this style." Cut-list item 3: outreach drafts go before the shortlist.

## Scope

In: `modules/series` (create from the chosen concept, four nights, variations, slugs, edits), `modules/talent` (candidates, tiers, overlap, outreach drafts), the step `plan` (series and talent parts), `/venues/[id]/series`, the night header used by plan 11.
Out: launch kit assets (plan 11), publishing (plan 12).

## Design

### Series

- `series.service.create(ctx, conceptId)` (owner or manager, RLS): inserts `series` and four `event_nights` in one database function call (`public.create_series` as `security invoker`, so RLS applies and the five rows commit together), dates from plan 05's weekday helper starting next week in the venue's time zone at a start time the owner sets (default 20:00).
- Variations: one `AI_MODELS.copy` call producing four short variations grounded in the concept's signals (for example week 2 adds a guest DJ from the shortlist's style, week 3 a themed menu, week 4 a "bring a friend" night). Zod output; no numbers allowed in variation text (validator rejects digits other than dates and times).
- Slugs: `concept-name-weekday-mon-dd`, lowercase, unique, checked against the database constraint; collisions get a short suffix.
- Edits: date, start time, variation text, status draft. Changing a published night is plan 12's concern.

### Talent

- Candidates from Qloo: `/search` and `/v2/insights` with `filter.type=urn:entity:artist` (or the format's domain), signals = the concept's signals, location = venue, `filter.popularity.max` from the tier policy, `take` 20.
- Tier policy (pure, tested): popularity to tier (`emerging` under 0.4, `local` 0.4 to 0.6, `regional` 0.6 to 0.8, `national` above), thresholds confirmed with plan 02's findings. Shortlist prefers emerging and local; national acts are shown only as "Style references: book a local act like this".
- Overlap score from the insights affinity for the concept's signals (receipt kept). Stored with the service role in `talent_candidates`.
- Outreach drafts (`AI_MODELS.copy`): short, personal, venue voice; mentions the night, date, fee range from the budget, and why their fans fit (no invented numbers; the validator checks digits against receipts or the venue's own settings). Editable and copyable; never sent by Encore.

### API

| Method and path                          | Access         | Notes                                                        |
| ---------------------------------------- | -------------- | ------------------------------------------------------------ |
| `POST /api/v1/concepts/[id]/series`      | Owner, manager | Creates series and four nights                               |
| `GET /api/v1/venues/[id]/series/current` | Team           | Series with nights and talent                                |
| `PATCH /api/v1/nights/[id]`              | Owner, manager | Date, time, variation                                        |
| `POST /api/v1/series/[id]/talent`        | Owner, manager | Builds or refreshes the shortlist (streamed)                 |
| `PATCH /api/v1/talent/[id]`              | Owner, manager | Edit outreach draft (stored separately from the model draft) |

A migration adds `talent_candidates.outreach_edited` (text, nullable) and `event_nights.starts_at` stays the single source of time; follow the new-table checklist in `CLAUDE.md` for any new table.

## Screens

- **`/venues/[id]/series`**: header with the concept name and "Change concept".
  - Calendar: at 390 a vertical list of four night cards (date, time, variation, status); at 768 two columns; at 1280 and 1440 four columns as a week strip.
  - Each night card: edit button opens a sheet with date, time and variation; validation inline.
  - Talent shortlist below: cards with name, tier badge, overlap meter with receipt, "Why they fit" line, outreach draft with Copy and Edit. At 1280 a two-column list with the draft in a side sheet.
  - Empty talent (no bookable matches): "No local acts matched closely. Here are styles to book instead", listing style references.
- Door staff see the calendar read only.

## Tests

- `create_series` function: five rows or none; refused for door staff (`rls.sql`).
- Dates across DST; start time in the venue's zone.
- Slug builder and collision suffix.
- Tier policy thresholds; national acts never in the shortlist.
- Variation and outreach validators reject invented numbers.
- Routes: 422 on bad edits; 403 or 404 by role.

## Deliverables

- [ ] Choosing a concept creates a four-night series atomically with distinct variations
- [ ] Dates and times correct in the venue's time zone, editable before publishing
- [ ] Talent shortlist of 5 to 8 bookable acts (or style references), each with tier, overlap and receipt
- [ ] Outreach draft per act, editable and copyable, never sent automatically
- [ ] Door staff see the series read only
- [ ] Screen standard met for the series page and sheets

## Verification

`npm run validate`, `npm run db:test`; for The Copper Room choose the top concept, edit week 2's time, open a talent receipt, copy a draft.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read this plan, plans 05 and 06, the `series`, `event_nights` and `talent_candidates` tables, plan 02's Findings for popularity, and the new-table checklist in `CLAUDE.md` section 3. Load the `claude-api` skill for the copy prompts and the `supabase-postgres-best-practices` skill before the migration.

Order: migration and `rls.sql` assertions, pure helpers and tests, services, routes, hooks, then the page. Run `npm run validate` and `npm run db:test`. Apply the migration to the hosted project only after local tests pass, then run the advisors and rename the file to the recorded version. Tick boxes only when verified. No long dashes. Do not commit unless asked.
