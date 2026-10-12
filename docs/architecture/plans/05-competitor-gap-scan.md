# Plan 05: Competitor gap scan

Status: Not started
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

## Deliverables

- [ ] Scout summary for each demo venue shows rating, hours and type from Places
- [ ] Nearby venues and target-night events listed with sources for each demo venue
- [ ] Covered themes extracted and validated; an empty area returns an empty list, not an error
- [ ] Partial and failed upstreams handled as designed, visible in the card
- [ ] Places photos served through the server without exposing the key
- [ ] Tests above pass; `GapScanCard` meets the Screen standard

## Verification

`npm run validate`; run scout and gap for each demo venue from a script and inspect `run_steps`; view the card in the gallery at four widths.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read this plan, `lib/places`, `lib/ticketmaster`, `lib/ai`, the step writer from plan 04, and the Places API (New) type list in Google's documentation. Load the `claude-api` skill before writing the theme prompt.

Order: weekday helper and tests, mapping helpers, service with mocked clients and tests, prompt with schema, step wiring, photo proxy route, card. Ask the user for `GOOGLE_PLACES_API_KEY`, `TICKETMASTER_API_KEY` and `ANTHROPIC_API_KEY` if missing. Run `npm run validate`. Tick boxes only when verified. No long dashes. Do not commit unless asked.
