# Plan 29: Venues anywhere in the world

Status: In progress. Data, forms, money and performers built (Oct 14); the coverage line and a full Nairobi plan are next.
Depends on: 03, 04, 05
Phase: 5 (added Oct 14 at the owner's request)
Judging criteria: Potential Impact (the brief's go-to-market names Kenya and other markets), Technological Implementation

## Goal

An owner in Nairobi, Lagos, London, Mexico City or Tokyo adds their venue as easily as one in Brooklyn, sees times on their own clock and money in their own currency, and gets a plan whenever Qloo holds enough taste data for their area. Where it does not, Loudnight says so plainly before a plan is started, and never invents a neighbourhood.

## What ties Loudnight to the United States today

Found by reading the code on Oct 14:

- `config/time-zones.ts` lists six US zones and maps US states to them. The venue form and its schema accept nothing else.
- `lib/format.ts` formats every amount as US dollars. Budgets and spend are stored in cents with no currency beside them.
- `lib/address.ts` reads the city from the second and third parts of a US-style address.
- Ticketmaster covers about thirty countries. Elsewhere the event half of the gap scan is empty.
- Qloo's coverage outside the US has not been measured. Plan 02 probed US areas only.
- Copy says "neighbourhood", "bar", dollars and US examples in places.

Google Places search and details already work worldwide. Distances are already metric.

## Scope

In: any IANA time zone, taken from the place itself; a currency per venue; city and country stored from the place; a coverage check before the first plan; the gap scan working without Ticketmaster; copy that does not assume the US; a probe of Qloo in six non-US cities recorded here.
Out: translating the owner's interface (plan 28 covers ads in Spanish), tax or tipping rules, prices converted between currencies.

## Design

### Data (one migration)

- `venues.country_code` (two letters, nullable for existing rows), `venues.city` (text, nullable), `venues.currency` (three letters, default `USD`, checked against a list in the database). Anonymous column grant extended to `country_code`, `city` and `currency`, which a demo page needs. `create_venue` gains the three arguments.
- No change to how amounts are stored: still whole minor units in the venue's own currency. Currencies with no minor unit (JPY, KRW) are handled by the formatter, using the currency's own digits.

### Where each fact comes from

- Time zone: Google Places details returns the place's IANA zone. The form shows it as read-only text with a "Change" control that accepts any zone the runtime knows (`Intl.supportedValuesOf("timeZone")`). The schema validates the same way. The six-zone list and the state map are deleted.
- Country and city: from the place's address components (`country` short code, `locality`, falling back to `postal_town`, then `administrative_area_level_2`).
- Currency: from the country, through a small table in `config/currencies.ts` covering the countries Loudnight is likely to meet first, falling back to USD, and changeable in settings.

### Coverage check

- Before the first plan for a venue outside the countries already proven, `POST /api/v1/venues/[id]/coverage` asks Qloo one cheap question (the area's music tags) and stores the answer in the cache like any other. Fewer than a set number of tags means "thin".
- The plan page then says: "Qloo knows this area well", or "Qloo has little data here. A plan may come back thin. Try a wider radius, or plan anyway." The owner decides. Nothing is blocked.
- The probe results for Nairobi, Lagos, London, Mexico City, Sao Paulo and Tokyo are recorded in this plan's Findings before the threshold is fixed.

### Gap scan without Ticketmaster

- Outside Ticketmaster's countries the events call is skipped, not failed. The scan says "Ticketed events are not listed for this country, so this is based on venues nearby" and freshness is scored from venues alone.

### Formatting

- `formatMoney(cents, currency)`; every caller passes the venue's currency. `cityOf` is replaced by the stored city and country. Dates stay in the venue's zone.

## Screens

- **Add a venue**: the search box says "Search for your venue, anywhere". After a pick: the address, the detected time zone and currency, both changeable.
- **Settings**: currency selector beside the money fields; amounts labelled with the currency's own symbol.
- **Plan page**: the coverage line described above, when relevant.

## Tests

Currency for a country (known, unknown, zero-decimal), time zone validation, city and country from address components, the coverage threshold, the gap scan when Ticketmaster does not cover the country, `formatMoney` in KES, EUR, GBP, JPY and USD, and the database rules for the new columns.

## Findings

Probed Oct 14 (output in `.probe/world/`, never committed).

- **Qloo knows these places.** Artists by location alone: Nairobi, Langata (Carnivore) and Nyeri open with Sauti Sol, Diamond Platnumz, Muthoni Drummer Queen, Alikiba, Harmonize, Eric Wainaina. Music tags for Nairobi: Kenyan, bongo flava, afropop, afrobeats. Lagos, London, Mexico City, Sao Paulo and Tokyo all answered with twenty artists and twenty tags in under four seconds.
- **Radius does not change artists.** 2 km and 20 km gave the same list in Nyeri and Langata. The radius stays a gap scan setting (places), not a performer setting.
- **Weighting the location backfires.** `signal.location.weight=high` with the night's tastes pulled Nairobi results towards American gospel. The area's own acts come from a location-only question instead (plan 10 revision).
- **Google Places gives the rest.** Text search returns `timeZone.id` (`Africa/Nairobi`, `Europe/London`, `Asia/Tokyo`) and address parts: country code, and the town under `locality` (Nairobi, Nyeri, Shibuya) or `postal_town` (London).
- **Ticketmaster is already optional.** The gap scan settles its call and carries on with nearby places when it fails or finds nothing, so no change was needed.

Built:

- Migration `venues_worldwide`: `country_code`, `city`, `currency` (default USD; existing US venues marked `US`), `create_venue` with three more arguments.
- `config/currencies.ts` (country to currency, about sixty countries), `config/time-zones.ts` now accepts any zone the runtime knows, `lib/address.ts` reads town and country from address parts.
- `formatMoney(cents, currency)` everywhere; the planner is told the currency and town, so cost estimates come in the venue's own money (`concepts-2026-10-14`).
- Onboarding and Settings: the detected zone shown as "Nairobi (GMT+3)", a currency picker, money labels in the venue's currency.
- Amount fields renamed `talentBudget` and `averageSpend` (they were `...Dollars`).

## Deliverables

- [ ] A venue outside the US can be added with its own time zone, city, country and currency (built and unit tested; to verify on screen with a Nyeri venue)
- [ ] Every amount on screen is in the venue's currency
- [x] Qloo coverage probed in six non-US cities and recorded here
- [ ] A thin area is said plainly before the first plan, and a plan can still be started
- [x] The gap scan works where Ticketmaster has no events (already settled; no change needed)
- [ ] No copy assumes the United States
- [ ] Screen standard met for the changed screens

## Verification

`npm run validate`, the rules test; add a venue in Nairobi and one in London, plan each, and read every amount and time on screen.

## Prompt

---

You are working on Loudnight. Follow `CLAUDE.md` exactly. Read this plan, plans 03 to 05, `lib/places/client.ts`, `config/time-zones.ts`, `lib/format.ts` and every caller of `formatMoney` and `cityOf`. Probe Qloo first and write the Findings. Then: migration and rules, config and pure helpers with tests, services, the form and settings, the coverage check, the gap scan. No long dashes. Do not commit unless asked.
