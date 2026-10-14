# Plan 30: Find your venue, in your country

Status: Built (Oct 14). The owner asked for the country first; defaults were taken for the other questions (below).
Depends on: 03, 29
Phase: 5 (added Oct 14 at the owner's request)
Judging criteria: Potential Impact (works where the owner is), Design (the first thing an owner does)

## Goal

An owner in Nairobi types "quiver" and sees Quiver Lounge on Mombasa Road and Quiver Kilimani on Ngong Road, not an archery shop in Indiana. The search knows which country to look in, looks only at the kinds of places Encore plans for, and fills in the address, town, time zone and currency from the place the owner picks.

## Why it is wrong today

Found on Oct 14 from the owner's screenshot (a search for "quiver" from Kenya listed three places in the United States):

- `searchPlaces` calls Google's Text Search with the words only. With no country and no location, Google leans on where the request comes from, which is our server in the United States.
- Text Search takes any kind of place, so an archery supplier and a bodywork studio came back for "quiver".

## What the probe showed

Probed Oct 14 with the project's Google key (output in `.probe/`, not committed):

- **Places Autocomplete (New)** with `includedRegionCodes: ["ke"]` and `includedPrimaryTypes: ["bar", "night_club", "restaurant", "cafe", "pub"]`: "quiver" returned Quiver lounge Mombasa Road, QUIVER KILIMANI (Ngong Road), Quiver eastlands, Quiver Steak House Milimani and Quiver Lounge A2, all in Nairobi. "carnivore" returned The Carnivore Restaurant on Langata Link Road first. In the UK, "blues kitchen" returned the Blues Kitchens in Manchester and London.
- At most **five** primary types per request (a sixth is a 400).
- "club nyeri" with the type filter returned nothing. So the search falls back to every kind of place in the country when the venue types find nothing.

## Design

### The country

- A country picker before the search box: a searchable combo box with each country's flag (emoji from the two-letter code, no images), its name, and type-ahead ("Ke" shows Kenya first). Keyboard and screen-reader friendly (Base UI Combobox).
- Pre-filled from the visitor's country (Vercel's `x-vercel-ip-country` header, the same one the landing page uses), never stored on its own. Falls back to the United States.
- The chosen country goes with every search, and is saved on the venue as `country_code` (column from plan 29), so currency and time zone follow it.
- Country names come from `Intl.DisplayNames`, the list from `config/countries.ts` (the countries Google Places covers, about 240, with their currency from `config/currencies.ts`).

### The search

- `POST /api/v1/places/search` takes `{ query, country, session }` and calls **Autocomplete (New)** with `includedRegionCodes: [country]` and `includedPrimaryTypes: ["bar", "night_club", "restaurant", "cafe", "pub"]`. If nothing comes back, it asks again with no type filter, and the list says "Showing every kind of place".
- Each suggestion shows its name, street and town (Google's `structuredFormat`), and its kind in plain words ("Night club", "Bar", "Restaurant").
- Picking a suggestion calls `GET /api/v1/places/[id]` (Place Details) for the location, address parts and time zone. The same session token covers both calls, so Google bills them as one search session rather than per keystroke.
- Typing is debounced (300 ms) and starts at 3 characters, as today. Rate limited per IP like every place search.
- After the pick: name, address, town, detected time zone ("Nairobi (GMT+3)") and currency ("Kenyan Shilling"), each changeable, then the rest of onboarding as now.

### Where it is used

- Onboarding step one and Settings (change address).

## Out

- Searching several countries at once. A venue is in one country.
- Map pins or a map picker. The list is faster on a phone and needs no map key.

## Tests

- Country list: every code has a name and a flag; detection falls back to the US; an unknown code is refused by the schema.
- Search service: sends the country and the five types; falls back to no types when empty; maps a suggestion to name, street, town and kind; refuses a country that is not two capital letters.
- Details: address parts to town, country, time zone and currency (the plan 29 helpers).
- Component: the combo box filters as you type and is reachable by keyboard.

## Deliverables

- [x] A country picker with flags, searchable, detected and changeable (flags drawn with Noto Color Emoji so Windows shows them too)
- [x] Search scoped to the chosen country and to venue types, with the fallback
- [x] Picking a place fills address, town, country, time zone and currency
- [x] "quiver" in Kenya finds the five Nairobi Quivers (verified in the app with real keyboard input, Oct 14)
- [ ] Screen standard met for onboarding step one and Settings

## Decisions (Oct 14)

The owner asked for the country to be picked before typing, detected and changeable. For the other questions the proposals were taken: bars, night clubs, restaurants, cafes and pubs first, every kind of place as the fallback; one venue sits in one country; the United States when the country cannot be told. Each can be changed in `config/countries.ts`.

## Verification

`npm run validate`; on the hosted app from a Kenyan connection (or with the country changed to Kenya): search "quiver", pick Quiver Lounge, check the town, time zone and currency, finish onboarding, plan the night.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read this plan, plan 29, `lib/places/client.ts`, `modules/venues/venues.search.ts`, `venues.places.ts` and the place search component. Order: config (countries), client calls (autocomplete, details) with tests, service and routes, hook, the combo box and the search, onboarding and Settings. No long dashes. Do not commit unless asked.
