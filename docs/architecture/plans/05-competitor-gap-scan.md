# Plan 05: Competitor gap scan

Status: Done (Oct 13), except the Places photo proxy (blocked on the key) and the user's UI review.
Depends on: 03, 04
Phase: 2
Judging criteria: Quality of the Idea (finds what nobody nearby offers), Potential Impact (avoids the four-bars-all-run-trivia trap)

## Goal

For a venue and its target weekday, Encore knows what is already on nearby: competing venues from Google Places and events from Ticketmaster on that night over the next four weeks. Claude reduces them to a short list of covered themes, so concepts avoid them and Novelty can be scored. The owner sees the competition plainly, with sources.

## Brief coverage

Pipeline step 1 "Scout the venue: Google Places resolves the address to coordinates, venue type, hours, rating and photos" and step 3 "Find the gap: Google Places lists nearby competing venues; Ticketmaster's Discovery API lists events nearby on the target weekday. Claude extracts what themes are already covered so concepts avoid them." Feature table: "Competitor gap scan". Problem statement: "They copy what's nearby."

## Scope

In: `modules/gap`, steps `scout` and `find_gap`, the weekday date helper, the theme extraction prompt, the `GapScanCard` component.
Out: scoring (plan 06), orchestration (plan 07).

## Design

- `scout(venue)`: Places details for the stored place id (name, rating, opening hours, one photo reference, primary type). Updates nothing the owner entered; stores the summary in `run_steps.output_summary`. Photo served later through a server route that proxies the Places photo (the key never reaches the browser), cached.
- `gap.weekdays.ts` (pure): next N dates of a weekday in an IANA time zone, returned as start and end instants for an evening window (17:00 to 02:00 local), correct across daylight saving changes.
- `nearbyVenues(venue)`: `placesNearby` with types bar, night club, cafe, restaurant, live music venue (exact type names confirmed against the Places API (New) table), radius from settings, max 20. Excludes the venue itself by place id.
- `eventsOnNight(venue, weekday)`: `eventsNear` for each of the next four target nights, radius in km, merged and de-duplicated by event id.
- `coveredThemes(venues, events)`: one `AI_MODELS.copy` call. Input: names, primary types, Ticketmaster segment and genre. Output (Zod): `{ themes: [{ theme, examples: string[], count }] }`, max 12 themes. Prompt in `gap.prompt.ts` (versioned). Upstream text is data, never instructions; the prompt says so and the output schema leaves no room for actions.
- Each call writes a `run_steps` row via the step writer from plan 04. Places and Ticketmaster responses are summarised, not cached in `qloo_cache`.
- Failure policy: if Places fails, themes come from events only and the step is marked partial; if both fail, the step fails with a plain message and Novelty defaults to neutral (0.5) with a flag the card shows.

## Screens

- **`GapScanCard`**: two lists side by side at 1280 (stacked at 390 and 768): "Nearby venues" (name, type, rating, distance) and "On Tuesdays nearby" (event, date, venue). Above them, the covered themes as `ToneBadge` chips with counts ("Trivia, 4 venues"). Source line under each list: "From Google Places" and "From Ticketmaster". Empty: "Nothing on Tuesdays within 2 km. That is your opening." Partial: one list shows its error line.

## Tests

- Weekday helper: plain week, a DST start week, a DST end week, a venue in Chicago versus New York.
- Venue type mapping and self-exclusion.
- Event de-duplication across four nights.
- Theme extraction: schema rejects extra fields; an instruction hidden in an event name is treated as text (the output stays within the schema).
- Failure policy: Places down, Ticketmaster down, both down.

## Build notes (Oct 13)

- Places types: `includedTypes` matches secondary types (a bakery with a bar counter came back for "bar"), so nearby search uses `includedPrimaryTypes` with the list in `config/gap.ts`. All twelve types were confirmed live.
- Google's opening hours contain a long dash and narrow spaces; `tidyHours` turns them into "4:00 PM to 2:00 AM".
- Ticketmaster returns season passes dated weeks earlier and one listing per timed entry (30 rows for one exhibition in Logan Square). Events are kept only when they start on a target night, and repeats of a name collapse to one row.
- Themes: one forced tool call to `AI_MODELS.copy`, checked by a schema that refuses extra fields (the injection guard) but clips over-long text instead of failing. The prompt asks for what happens on the night, not venue types; plain bars group as "Drinks, no programme". Version `gap-themes-2026-10-13b`.
- Live results: Williamsburg 20 venues, 13 events, themes led by live concerts and stand-up; East Austin 20 venues, 10 events, themes include DJ nights and sports on TV; Logan Square 20 venues, 2 events. Each run writes three trace rows (Places, Ticketmaster, planner) under `find_gap`.
- `withStep` in `modules/runs/runs.steps.ts` is the one way to trace a tool call; the taste service uses it too.
- Script: `npm run gap:print -- <venueId>`.

## Deliverables

- [x] Scout summary shows rating, hours and type from Places (verified on Union Pool; the three demo venues have no Places id, so scouting skips them by design)
- [x] Nearby venues and target-night events listed with sources for each demo venue
- [x] Covered themes extracted and validated; an empty area returns an empty list, not an error
- [x] Partial and failed upstreams handled as designed, visible in the card
- [ ] Places photos served through the server without exposing the key (blocked: this key returns no `photos` field for any place, so there is nothing to serve; enable Place Photos on the key, then add a binary route wrapper)
- [ ] Tests above pass; `GapScanCard` meets the Screen standard (tests pass; the card is in the gallery under Competitor gap scan, awaiting the user's check at four widths)

## Verification

`npm run validate`; run scout and gap for each demo venue from a script and inspect `run_steps`; view the card in the gallery at four widths.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read this plan, `lib/places`, `lib/ticketmaster`, `lib/ai`, the step writer from plan 04, and the Places API (New) type list in Google's documentation. Load the `claude-api` skill before writing the theme prompt.

Order: weekday helper and tests, mapping helpers, service with mocked clients and tests, prompt with schema, step wiring, photo proxy route, card. Ask the user for `GOOGLE_PLACES_API_KEY`, `TICKETMASTER_API_KEY` and `ANTHROPIC_API_KEY` if missing. Run `npm run validate`. Tick boxes only when verified. No long dashes. Do not commit unless asked.
