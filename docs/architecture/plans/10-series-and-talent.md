# Plan 10: Series planner and talent finder

Status: Built and live, verified on a real venue (Oct 13)
Depends on: 06
Phase: 4
Judging criteria: Design (every step ends in something to approve, edit or send), Potential Impact (paid gigs for local performers), Technological Implementation (Qloo entity search and popularity)

## Goal

Choosing a concept turns it into a four-week series on a calendar, each week with its own variation so regulars keep coming back. Loudnight shortlists performers whose fans overlap this audience at a bookable popularity tier, explains why each fits with receipts, and drafts a personal outreach message for each. The owner can edit dates, variations and messages before anything goes out.

## Brief coverage

"Review the series plan. The chosen concept becomes 4 weekly dates on a calendar, each with a variation so regulars keep coming back." "Book talent. Loudnight shortlists performers whose fan base overlaps this audience, at the right popularity tier, and drafts a personal outreach message for each." Feature table: 4-week series calendar; talent finder and outreach. Risk: "Talent suggestions are famous, not bookable: filter to lower popularity tiers; frame as acts this crowd loves, book a local act in this style." Cut-list item 3: outreach drafts go before the shortlist.

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
- Outreach drafts (`AI_MODELS.copy`): short, personal, venue voice; mentions the night, date, fee range from the budget, and why their fans fit (no invented numbers; the validator checks digits against receipts or the venue's own settings). Editable and copyable; never sent by Loudnight.

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

- [x] Choosing a concept creates a four-night series atomically with distinct variations
- [x] Dates and times correct in the venue's time zone, editable before publishing
- [x] Talent shortlist of 5 to 8 bookable acts (or style references), each with tier, overlap and receipt
- [x] Outreach draft per act, editable and copyable, never sent automatically
- [ ] Door staff see the series read only
- [ ] Screen standard met for the series page and sheets

## What changed while building

- The series is made with one button on the Series page ("Make it four weeks") after a night is chosen, not at the moment of choosing. Choosing stays instant, and the copy call happens when the owner asks for it.
- `create_series(concept, starts_on, nights)` takes the four nights as JSON. Slugs end in four characters of the concept's own id, so they are unique without a lookup: `low-light-tuesdays-tue-oct-20-3fa9`.
- Start time is 20:00 in the venue's zone and is edited per night; there is no series-wide start time setting.
- Numbers in copy: the variation writer may use no digits at all. The outreach writer may use none either and marks where the date, time and fee go; Loudnight fills those from the first night and the talent budget. A draft that breaks either rule is replaced by a plain fallback, so a series or a shortlist is never blocked by the copywriter.
- Talent comes from one `/v2/insights` call anchored on the tastes the chosen night cites (falling back to the area's leading music styles), with `filter.popularity.max` 0.8, and a second call with `filter.popularity.min` 0.8 for style references. `/search` was not needed. Music formats look for artists; other formats look for people.
- `POST /series/[id]/talent` is a plain request (about 30 seconds on a cold cache), not a stream. `GET /venues/[id]/series/current` was not built: the page is rendered on the server and refreshed after each change. `GET /talent/[id]/receipt` was added so the overlap opens its receipt.
- The migration also adds `talent_candidates.response_path` and `fit_signals`, so every overlap has a receipt and a reason.
- Demo venues (plan 09) now get their series and performers from the same services during the precompute.
- A booking message mentions only the music and nights out the crowd likes. The other tastes a night was built on (a brand, a show) still anchor the Qloo query and appear on the Series page, but read oddly in a message to a musician.
- Docker was not running, so the full `supabase/tests/rls.sql` was run against the hosted project instead of with `npm run db:test`: all assertions passed and rolled back. `src/types/database.ts` was updated by hand for the three columns and the function, then checked against types generated from the hosted project: identical.

## Revision, Oct 13: performers as people, not numbers

The owner's feedback was that a name and an affinity number is not something they can act on. Each performer now has a card built from the public profile Qloo holds:

- A photo (from Qloo's image host, the only outside image origin allowed), up to three genres, a one-line description, and the overlap said in words first ("Very strong crowd match") with the number and monthly listeners inside the same receipt chip.
- A contact sheet: what they are known for, songs to listen to first, links to their public channels (Instagram, Spotify, X, Facebook), the drafted message with "Email it" (opens the owner's own mail app with the message filled in), Copy, and "They said yes: mark as booked".
- Qloo holds no email addresses, so none are shown or guessed. The owner adds the address in their mail app, or messages the act on one of its channels.
- For music nights, only acts with at least 1,000 monthly listeners are offered. Without that, anyone famous who once released a single came back as a "local draw".
- Looking again keeps a booking and the owner's wording for any act that is still on the list.
- A second migration adds `talent_candidates.profile` (the cut-down public profile) and `booked_at`. Booked acts are what the launch kit (plan 11) will put on the poster and posts.

## Revision, Oct 14: local acts first, a fresh list each time, bookings that stick

The owner booked a second act and the ad still named the first; "Find new performers" brought back the same names; a venue in Nairobi should see Kenyan acts before anyone else.

Probe (Oct 14, output in `.probe/world/`, not committed):

- Asking Qloo for artists with the location alone gives the area's own favourites. Nairobi, Langata (Carnivore) and Nyeri all open with Sauti Sol, Diamond Platnumz, Muthoni Drummer Queen, Alikiba, Harmonize, Eric Wainaina. With the night's tastes added, the same point starts returning American gospel names, and `signal.location.weight=high` makes that worse, not better.
- `signal.location.radius` changes nothing for artists: 2 km and 20 km give the same list. Qloo places an artist's fans by region, not by street. No radius control is offered for performers; the radius stays a gap scan setting.
- `page=2` returns a genuinely new set of twenty.
- Qloo carries `place_of_birth` for some artists ("Nairobi, Nairobi County, Kenya") and country tags for others.

Changes:

- Two Qloo calls build the shortlist: the night's tastes near the venue (as before), and the area's own favourites (location only). Acts in both come first, then area favourites, then the rest of the night's fits, inside the same tier rules. Each act keeps a receipt in the answer it came from. The card says "Popular near you" for an area favourite and "Born in {place}" only when Qloo says so.
- "Find new performers" asks for the next page of both answers (1, 2, 3, then back to 1). `talent_candidates.search_page` records which page the list came from.
- Booked acts and acts the owner reworded are never deleted by a refresh, whether or not they come back.
- The ad names every booked act in the order they were booked ("With A and B", "With A, B and 2 more"), and "The booked act" photo is the latest booking with a photo. Booking or unbooking from the Series page refreshes the ad.
- `talent_candidates.source` (`night`, `area`, `both`) records why an act is on the list.

- [x] A refresh never loses a booked or reworded act (service test, and on hosted: La Coop's four bookings survived two looks)
- [x] Find new performers shows a different list (verified on hosted: two looks, two different sets; an empty later page falls back to the first)
- [ ] A venue outside the US gets its area's own acts first (verified with a Nairobi venue)
- [ ] The ad names every booked act and changes when a booking changes

## Verification

`npm run validate`, `npm run db:test`; for The Copper Room choose the top concept, edit week 2's time, open a talent receipt, copy a draft.

## Prompt

---

You are working on Loudnight. Follow `CLAUDE.md` exactly. Read this plan, plans 05 and 06, the `series`, `event_nights` and `talent_candidates` tables, plan 02's Findings for popularity, and the new-table checklist in `CLAUDE.md` section 3. Load the `claude-api` skill for the copy prompts and the `supabase-postgres-best-practices` skill before the migration.

Order: migration and `rls.sql` assertions, pure helpers and tests, services, routes, hooks, then the page. Run `npm run validate` and `npm run db:test`. Apply the migration to the hosted project only after local tests pass, then run the advisors and rename the file to the recorded version. Tick boxes only when verified. No long dashes. Do not commit unless asked.
