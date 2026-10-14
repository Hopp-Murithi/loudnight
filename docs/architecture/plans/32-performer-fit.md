# Plan 32: The right performers for this room, this budget, this town

Status: Parts A to E built (Oct 14). Part C live-checked for MusicBrainz in Brooklyn; Wikidata checked by probe, in-app check in the simulation.
Depends on: 10, 11, 29
Phase: 5 (the owner's requests of Oct 14)
Judging criteria: Potential Impact, Technological Implementation (Qloo used where it is strongest, other sources only where it is not)

## Goal

A café in Nyeri that hosts poetry nights should be offered local poets it can afford, not Diamond Platnumz. A Brooklyn bar with a dance floor should be offered DJs. Every list says why each act is on it, where the fact came from, and whether it is likely within the owner's budget.

## What the probes showed (Oct 14, output in `.probe/`, never committed)

- **Qloo's popularity is global.** Diamond Platnumz scores 0.58 and Harmonize 0.13, so by popularity alone they read as local acts, yet both are East African superstars. Spotify listeners understate them too (about 670,000 for Platnumz), because much of East Africa listens on Boomplay and Audiomack.
- **Qloo finds musicians by genre well**: `filter.tags=urn:tag:genre:music:house` returned house DJs near Nairobi (DJ Maphorisa, Heavy K, Prince Kaybee) and Brooklyn (Honey Dijon, Sateen).
- **Qloo finds few poets and comedians.** Genre tags returned three comedians and two poets near Brooklyn and none near Nairobi. Occupation tags (`urn:tag:occupation:wikidata:comedian` and others) are ignored by the insights endpoint: the answer is the same whatever the occupation.

So Qloo stays the source for what the crowd loves and for musicians; other sources fill in poets, comedians and act size, each labelled with where it came from.

## Part A: what the venue hosts

- Onboarding and Settings ask "What can your room host?" (choose any): live music, DJs and dancing, poetry and spoken word, comedy, quiet seated sets (acoustic, jazz), quizzes and games, talks, film. Stored as `venue_settings.hosts` (enum array) with "seated" or "standing" as `atmosphere`.
- The planner (concepts prompt) receives them and only proposes formats the room hosts.
- The performer search follows the night's format: music formats look for artists filtered to the night's genres; DJ nights add electronic genre tags; poetry and comedy use Part C's sources.

## Part B: within budget, honestly

- **Act size** is judged from what is known, never invented: Spotify monthly listeners (already in Qloo's answer), plus a "household name in this country" check by the copy model on the act's name and country, cached per act and country. The check is a yes or no label, never a number, and the card says "Encore's estimate: ask the act".
- Each card says one of: "Likely within your budget", "A stretch", "Probably beyond this budget". The list hides "beyond" acts by default, with "Show bigger names" to see them.
- The thresholds scale with the budget in the venue's own currency through a small table of typical small-venue fees per country band (config, reviewed by the owner), not by converting currencies.
- A star the owner knows is too big can be hidden for good ("Not for us").

## Part C: poets, comedians and local artists where Qloo is thin

| Source                   | What it adds                                                                                                                  | Access                                 | Notes                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| Wikidata                 | People by occupation (poet, comedian, DJ, actor) with birthplace and country; Wikipedia article count as a rough fame measure | Free, open data (CC0), SPARQL endpoint | Polite rate, a descriptive User-Agent; cached like Qloo answers    |
| MusicBrainz              | Artists by area (city or country) with genre tags                                                                             | Free, open data, 1 request a second    | Fills "artists from Nyeri"                                         |
| Ticketmaster attractions | Performers who play shows in the country, by type including comedy                                                            | Key already in Encore                  | About 30 countries                                                 |
| Spotify                  | Followers and popularity, for act size                                                                                        | Free key                               | No location; some features restricted for new apps since late 2024 |
| YouTube Data API         | Subscriber counts, for act size where Spotify understates                                                                     | Free daily quota                       | After launch                                                       |

Each act shown from these sources carries a source label ("From Wikidata: born in Nyeri") and never a Qloo receipt it does not have. Qloo still provides the evidence that the crowd loves the style.

For the hackathon: Wikidata and MusicBrainz. After launch: Spotify, YouTube and Ticketmaster for size and touring.

Built (Oct 14, migration `20261014081659_open_data_talent`):

- Which source fits a night: DJs (Wikidata) for DJ nights, town musicians (MusicBrainz) for live music, poets and comedians (Wikidata) when the night's name says so or an open-format night happens in a room that hosts them.
- Wikidata: living people in the role born within 50 km, best known first but capped at 20 Wikipedia languages so household names stay out; the whole country when the town has few. MusicBrainz: working, style-tagged artists from the town.
- Up to four open acts join the shortlist after Qloo's, labelled "From Wikidata" or "From MusicBrainz" with a link to the record. The database refuses a Qloo receipt on them. The household-name check runs first and leaves open-data stars out entirely.
- Answers are cached a week in `open_data_cache` (server only) and a failing source adds nobody rather than failing the search.
- Probe (Oct 14): Nairobi gives poets and comedians (Warsan Shire, Shailja Patel, Elsa Majimbo); Nyeri gives none nearby, so Kenya-wide (Philo Ikonya, Abel Mutua); Brooklyn without the fame cap gives Eddie Murphy, with it Wyatt Cenac and Sarah Kay. Queries take 10 to 40 seconds, hence the cache.

## Part D: more than one quiet night

- A venue may have up to three quiet nights (`venue_settings.quiet_nights weekday[]`, one to three, the first being today's `slow_night`). Onboarding asks for one and offers "Add another night"; Settings lets the owner add, remove and reorder them.
- The Plan page asks which night to plan; each night has its own runs, chosen night and series. Home shows each night's state.
- Migration with `rls.sql` assertions; `slow_night` stays as the first entry so nothing breaks.
- Built: a trigger keeps `slow_night` equal to the first quiet night whichever one a writer sets. Home, Plan, Series and Promote take `?night=`; a switcher shows when there is more than one night. A run may only start for one of the venue's quiet nights (409 otherwise).

## Part E: the booked acts on the poster

- With "The booked act" photo, one act fills the photo panel as today; two or three acts appear as a tidy strip of portraits (equal tiles, names under them), never more than three; the rest are named in the line.
- Photos come only from Qloo's image host (already allowed) and fall back to the night photo if one fails.

## Tests

Hosts and atmosphere in the schema and prompt; the act size label from listeners and the star check (mocked); hiding and showing bigger names; Wikidata and MusicBrainz clients with synthetic answers; poster layout for one, two and three acts; quiet nights migration assertions.

## Deliverables

- [ ] The room's hosts and atmosphere asked for and used by the planner and the performer search
- [ ] Every act labelled for budget; stars hidden by default (Diamond Platnumz not offered to a 500,000 shilling night)
- [ ] Poets and comedians found for Brooklyn and Nairobi from Wikidata and MusicBrainz, labelled by source
- [x] Up to three quiet nights per venue (migration `20261014075219_quiet_nights`, `rls.sql` passed on hosted; Settings reorder and the night switcher checked at 390 and 1280)
- [ ] Booked acts' photos on the poster, one to three, tidy

## Verification

`npm run validate`, `npm run db:test`; a Nairobi café hosting poetry and a Brooklyn bar hosting DJs, each searched, with the source and budget label read on every card.
