<p align="center">
  <img src="docs/screenshots/hero.jpg" alt="Loudnight: fill your quiet nights. Three phone screens: the landing story, a planned night scored 100 with its evidence, and the live door count." width="100%">
</p>

<p align="center">
  <a href="https://loudnight.aihookd.site"><img alt="Open the live app" src="https://img.shields.io/badge/Open_the_live_app-F2B860?style=for-the-badge"></a>
  <a href="https://loudnight.aihookd.site/demo/8f6a1f8e-2c1b-4c55-9d2e-0b7a3c1e0001"><img alt="See a finished plan, no sign-up" src="https://img.shields.io/badge/See_a_finished_plan-no_sign--up-3ECF8E?style=for-the-badge"></a>
  <a href="https://loudnight.aihookd.site/e/cider-alt-country-wednesdays-wed-oct-21-6726"><img alt="A live event page" src="https://img.shields.io/badge/A_live_event_page-guest_view-A4361C?style=for-the-badge"></a>
</p>

<p align="center">
  <img alt="Built on Qloo" src="https://img.shields.io/badge/Taste_data-Qloo-1c1613?style=flat-square">
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-1c1613?style=flat-square">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres-1c1613?style=flat-square">
  <img alt="Claude" src="https://img.shields.io/badge/Claude-Sonnet_5.5-1c1613?style=flat-square">
  <img alt="Expo SDK 57" src="https://img.shields.io/badge/Door_app-Expo_SDK_57-1c1613?style=flat-square">
  <a href="https://github.com/Hopp-Murithi/loudnight/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Hopp-Murithi/loudnight/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-1c1613?style=flat-square">
</p>

> **Qloo knows what a neighbourhood loves. Loudnight turns that into people through the door on a Tuesday.**

Loudnight helps bars, cafes, restaurants and small music venues fill their quiet nights. The owner enters the venue's address and the nights that are slow. Loudnight finds out what the people who live nearby enjoy, checks what other venues nearby already offer, and suggests a weekly night that nobody else runs. It then finds local performers the venue can afford, makes the posters and social posts, lets guests reserve a place, checks them in at the door, and shows the owner how many people came compared with how many they needed.

It is live and works in any country and currency. It was tested end to end in Austin, Brooklyn, Chicago and Nairobi.

Built for the Qloo hackathon (submissions close Oct 30, 2026). The brief: [`docs/reference/encore-system-brief.pdf`](docs/reference/encore-system-brief.pdf).

## Contents

|                                                     |                                                     |                                             |
| --------------------------------------------------- | --------------------------------------------------- | ------------------------------------------- |
| [The problem](#the-problem)                         | [The judging criteria](#the-judging-criteria)       | [How it is built](#how-it-is-built)         |
| [How Loudnight solves it](#how-loudnight-solves-it) | [How Loudnight uses Qloo](#how-loudnight-uses-qloo) | [What is built today](#what-is-built-today) |
| [Try it in 60 seconds](#try-it-in-60-seconds)       | [Plans: Free and Premium](#plans-free-and-premium)  | [Roadmap](#roadmap)                         |
| [See it work](#see-it-work-a-wednesday-in-austin)   | [By the numbers](#by-the-numbers)                   | [Run it yourself](#run-it-yourself)         |

## The problem

Walk past almost any bar or restaurant on a Monday, Tuesday or Wednesday night and it is half empty. Those nights still cost the owner rent, staff, heating and stock. A venue that is quiet three nights a week is paying for those nights without earning from them.

Owners know the answer is to run something: a music night, a quiz, a comedy show, a supper club. But they get stuck on four questions:

1. **What would people around here actually come for?** Owners guess, copy the venue down the street, or ask a chatbot that gives the same answer to everyone.
2. **Who could play it, at a price I can afford?** Booking agents push big names. Local acts are hard to find.
3. **How do I tell people?** Making posters, posts and an event page takes hours the owner does not have.
4. **Did it work?** Most venues never count who came because of the night, so they cannot tell whether to keep it.

Ticketing apps sell tickets. Marketing tools post ads. Booking sites list performers. None of them tells a venue **which night to run**, and none of them connects the plan to the people who walk through the door.

## How Loudnight solves it

| The owner's question                    | What Loudnight does                                                                                                                                                                                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What would people around here come for? | Reads what people near the venue love (music, food, films, brands, nights out) through Qloo, checks what nearby venues and events already offer, and suggests three weekly nights nobody else runs. Every number shown can be opened to see exactly where it came from. |
| Who could play it?                      | Suggests performers whose fans match the night, local acts first, each labelled as likely within the budget or not, with a booking message ready to send. Stars the venue could never afford are left out.                                                              |
| How do I tell people?                   | Makes posters, stories, banners and short videos with the booked performers' photos, writes the captions for each network, and publishes an event page where guests reserve a place and get a ticket.                                                                   |
| Did it work?                            | Staff check guests in at the door by scanning tickets or tapping names. Every phone at the door shows the same live count against the number of guests the venue needs to break even, and the results page keeps each night's numbers.                                  |

**In short: about ten minutes of the owner's time, from an address to a promoted night with a guest list and a working door.**

## Try it in 60 seconds

No account is needed for the first three steps.

| Step | Open                                                                                                                        | What to look for                                                                                                                                           |
| ---- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | [The landing page](https://loudnight.aihookd.site)                                                                          | Scroll down: each scroll moves the story on, and it zooms into your own country.                                                                           |
| 2    | [A finished plan for The Copper Room in Brooklyn](https://loudnight.aihookd.site/demo/8f6a1f8e-2c1b-4c55-9d2e-0b7a3c1e0001) | Three scored nights. **Tap any number** to see the exact Qloo question and answer it came from. Compare it with the plain chatbot answer on the same page. |
| 3    | [A live event page](https://loudnight.aihookd.site/e/cider-alt-country-wednesdays-wed-oct-21-6726)                          | What a guest sees: the night, the performers, and a button that reserves a place and gives them a ticket.                                                  |
| 4    | [Add your own venue](https://loudnight.aihookd.site/signup)                                                                 | Choose your country, find your venue, pick your quiet nights. About three minutes later you have three nights planned for your street.                     |

## See it work: a Wednesday in Austin

We tested the whole journey on Oct 14 with a made-up restaurant, Juniper Supper Club on South Congress in Austin. Its quiet nights are Wednesday and Tuesday, it can host live music and comedy, and its budget for performers is $400 a night. Loudnight planned the Wednesday in about three minutes. Its top suggestion, **Cider & Alt-Country Wednesdays**, scored 100 out of 100. Two local bands were booked, and the poster and captions named them. The first night was published, a guest reserved a place on a phone without an account, the ticket was scanned on a second phone, and the door screen on a third phone went from 0 to 2 of 35 without refreshing.

<h3>1. Plan the night</h3>
<table>
  <tr>
    <td align="center" valign="top" width="33%">
      <img src="docs/screenshots/01-landing.jpg" width="270" alt="The landing page: every venue has a quiet night"><br>
      <b>The story</b><br>
      The landing page zooms into the visitor's own country
    </td>
    <td align="center" valign="top" width="33%">
      <img src="docs/screenshots/02-home.jpg" width="270" alt="Home: the chosen Wednesday night and what to do next"><br>
      <b>Home</b><br>
      Two quiet nights, one chosen, and the next step
    </td>
    <td align="center" valign="top" width="33%">
      <img src="docs/screenshots/03-plan.jpg" width="270" alt="The top suggestion with its score and evidence"><br>
      <b>The suggestion</b><br>
      Scored 100, and every piece of evidence opens its source
    </td>
  </tr>
</table>

<h3>2. Book and promote</h3>
<table>
  <tr>
    <td align="center" valign="top" width="33%">
      <img src="docs/screenshots/05-performers.jpg" width="270" alt="Local performers with a budget label and crowd match"><br>
      <b>Local performers</b><br>
      Booked acts first, each labelled for the budget
    </td>
    <td align="center" valign="top" width="33%">
      <img src="docs/screenshots/06-poster.jpg" width="270" alt="The poster with both booked acts and a ticket QR code"><br>
      <b>The poster</b><br>
      Both performers, the date, and a QR code for tickets
    </td>
    <td align="center" valign="top" width="33%">
      <img src="docs/screenshots/07-event.jpg" width="270" alt="The public event page"><br>
      <b>The event page</b><br>
      What a guest opens to reserve a place
    </td>
  </tr>
</table>

<h3>3. Run the night</h3>
<table>
  <tr>
    <td align="center" valign="top" width="33%">
      <img src="docs/screenshots/08-ticket.jpg" width="270" alt="A guest's ticket with its QR code"><br>
      <b>The ticket</b><br>
      Any phone camera opens it, and staff check the guest in from it
    </td>
    <td align="center" valign="top" width="33%">
      <img src="docs/screenshots/09-door.jpg" width="270" alt="The door screen after a check-in"><br>
      <b>The door</b><br>
      Updated live on every phone: 2 of the 35 needed to break even
    </td>
    <td align="center" valign="top" width="33%">
      <img src="docs/screenshots/10-results.jpg" width="270" alt="Results updating live during the night"><br>
      <b>Results</b><br>
      Tonight's count during the night, then each night's takings
    </td>
  </tr>
</table>

<h3>4. Run the platform</h3>
<p align="center">
  <img src="docs/screenshots/11-admin.jpg" width="820" alt="The administrator console listing venues with their status"><br>
  <b>The administrator console</b><br>
  Every venue and person, with details, suspension, deactivation, every plan, a full change history, and a read-only view of any user's screens for support
</p>

## The judging criteria

| Criterion                        | What Loudnight brings                                                                                                                                                                                                                                                                                                                                                                                                                        | Where to check                                                                                                                                                       |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Technological Implementation** | Qloo is used at five of the six planning steps, about 35 calls for each plan. The AI planner decides which pairs of tastes to test, and Qloo confirms or rejects each pair for that neighbourhood. Every number is saved with the Qloo answer it came from, and **the database refuses any number that is not in that answer**. Each venue's data is kept private by the database itself. More than 500 automated tests run on every change. | [How Loudnight uses Qloo](#how-loudnight-uses-qloo), and tap any number in the [demo plan](https://loudnight.aihookd.site/demo/8f6a1f8e-2c1b-4c55-9d2e-0b7a3c1e0001) |
| **Design**                       | One complete journey: address, plan, four-week series, performers, ads, event page, tickets, door, results and administration. It works on a phone first, in light and dark, with every empty, loading and error screen designed, plus a separate phone app for door staff.                                                                                                                                                                  | [See it work](#see-it-work-a-wednesday-in-austin)                                                                                                                    |
| **Potential Impact**             | It goes after a cost every venue owner knows: the nights that lose money. The owner sees the break-even number on every screen, the live count at the door, and each night's takings. It works in any country and currency.                                                                                                                                                                                                                  | [The problem](#the-problem), [How Loudnight solves it](#how-loudnight-solves-it)                                                                                     |
| **Quality of the Idea**          | It uses taste data to help the business, not the customer: it tells a venue what to run, instead of telling a person what to watch. Its nights combine tastes from different areas (music with food, a film with a night out), and Qloo confirms each combination locally. A plain chatbot answer sits beside it to show the difference.                                                                                                     | The "Generic AI" comparison on the [demo plan](https://loudnight.aihookd.site/demo/8f6a1f8e-2c1b-4c55-9d2e-0b7a3c1e0001)                                             |

## How Loudnight uses Qloo

Qloo answers the question no venue tool can: what do the people who live around this address actually love? Loudnight asks it at every stage and keeps every answer.

| Stage                  | What Loudnight asks Qloo (the `/v2/insights` endpoint, near the venue)                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Read the neighbourhood | Eleven areas of taste: music styles and kinds of night out, then artists, films, TV, brands, books, podcasts, people and destinations. Very popular global names are filtered down so local favourites show up. |
| Who the crowd is       | `urn:demographics` for the night's tastes: the age groups it leans towards                                                                                                                                      |
| What is already on     | `urn:entity:place` within 2 km, alongside Google Places and Ticketmaster, so the night fills a real gap                                                                                                         |
| Invent the nights      | The AI planner calls a `check_overlap` tool: do people who like one thing here also like another? Qloo confirms or rejects each pair, for example fans of alt-country and a local cider.                        |
| Find performers        | Artists whose fans share the night's tastes, the area's own favourites, and artists of the area's own sound (`filter.tags`). Famous names are shown only as a style to look for, never as acts to book.         |

**No number without a receipt.** Every Qloo answer is saved together with the question that produced it. Every number on screen points to the saved answer and the exact place in it, and the database refuses a number that is not there. One tap shows the question and the answer. Answers are reused for a week and kept after they are refreshed, so old receipts still open.

Where Qloo has few performers, Loudnight adds them from open data and says so on each card: Wikidata for musicians, poets, comedians and DJs, and MusicBrainz for musicians from the town or country. One check gives every act a home country and marks household names, so a venue sees its own country's acts first and never stars it could not book.

<details>
<summary><b>Feedback for Qloo</b>: what we learned testing the hackathon API in Austin, Brooklyn, Chicago and Nairobi</summary>

- **Popularity is global, not local.** A star who is huge in one region can score low worldwide and look like a small, bookable act. A popularity score within a country or around a location would make "can this venue book them?" much more accurate.
- **Affinity is close to 1.0 for the top results, and the top results repeat from city to city.** We cap popularity (`filter.popularity.max`) to bring local names forward. A documented way to rank by what is distinctive about an area would help every local use case.
- **Invalid parameters are ignored without a warning.** They return 200 with an empty list. `signal.location.radius` changed nothing in our tests, and `signal.location.weight=high` made results less relevant. Occupation tags such as `urn:tag:occupation:wikidata:comedian` are ignored by insights. A field naming ignored parameters would save developers hours.
- **Local artists are thin outside the biggest markets.** Only two artists carry the `urn:tag:genre:music:kenyan` tag. Asking which artists fans of Kenyan music follow returns mostly Nigerian, Jamaican and American names, because it describes the fans rather than the artists. A home country field on artists would let Qloo answer "who from here plays this sound".
- **Poets and comedians are thin.** Genre tags find DJs well, but searches near Nairobi found no comedians.
- **Smaller points:** `filter.location` needs WKT (`lat,lng` returns 400). `urn:entity:video_game` returns 400 on the hackathon host. Short descriptions are often not tagged by language. One artist can have several Spotify accounts.
- **What worked well:** the tastes of different neighbourhoods are clearly different (East Austin: alt-country, Americana, blues; Williamsburg: indie and experimental). Overlap questions answer fast. Birthplace and Spotify listener counts on artists made local-first booking possible.

</details>

## Plans: Free and Premium

This is the planned pricing. During the hackathon every feature is free for everyone.

|                                         | **Free**                                     | **Venue** (Premium)                                                         | **Group**                     |
| --------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------- |
| Price                                   | $0                                           | **$49 a month** (€45, £39)                                                  | **$199 a month** (€179, £159) |
| Venues                                  | 1                                            | 1                                                                           | Up to 5, one bill             |
| Quiet nights planned                    | 1                                            | Up to 3                                                                     | Up to 3 at each venue         |
| Fresh plans                             | 1 a month                                    | As many as you need                                                         | As many as you need           |
| Evidence behind every number            | Yes                                          | Yes                                                                         | Yes                           |
| Four-week series, a new twist each week | Yes                                          | Yes                                                                         | Yes                           |
| Local performers                        | The top 3                                    | The full list, new lists on request, budget labels, ready messages, booking | The same, for every venue     |
| Ads                                     | Posters with a small Loudnight mark          | Posters, stories, banners and video, no mark, Spanish captions              | The same                      |
| Event page and reservations             | Up to 50 a night                             | Unlimited                                                                   | Unlimited                     |
| The door                                | The web door screen                          | The door app, and team roles for managers and door staff                    | The same, at every venue      |
| Results                                 | Tonight's count                              | Every night's takings, the monthly gain, and what Loudnight paid back       | Every venue side by side      |
| Paid tickets (planned)                  | 3% booking fee paid by the guest, at most $1 | The same                                                                    | The same                      |

| Plan  | Who it is for                               | What it does for them                                                                                                                                               |
| ----- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Free  | A venue trying Loudnight out                | Finds the night its neighbourhood is missing and runs it once, with a guest list and a door screen.                                                                 |
| Venue | A bar, cafe or restaurant with quiet nights | Fills one to three quiet nights every week. One extra full night (for example 35 guests spending $38 each, about $1,330) pays for more than two years of Loudnight. |
| Group | A hospitality group or promoter             | Runs every venue's weekly nights, teams and results from one place.                                                                                                 |

## By the numbers

|                           |                                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| The planner               | 6 fixed steps, shown live as they run. The AI chooses its tools inside each step, never the order of the steps. |
| Taste read for each venue | 11 areas of taste from Qloo                                                                                     |
| One plan                  | About 35 Qloo calls, 3 scored nights, about 3 minutes                                                           |
| The score                 | 40 x audience fit + 20 x novelty + 20 x venue fit + 20 x cost fit, calculated by the database                   |
| Tests                     | More than 500 automated tests, plus database tests for every role                                               |
| Apps                      | The web app and the door app, both using the same API                                                           |
| Countries                 | Any country, currency and time zone; 237 countries in the venue search                                          |

## How it is built

**Where it runs:** the web app on [Vercel](https://loudnight.aihookd.site); data, sign-in and live updates on [Supabase](https://supabase.com) (Postgres); taste data from [Qloo](https://www.qloo.com); planning and writing by [Claude](https://www.anthropic.com); places from Google; events from Ticketmaster; automatic checks on every change in [GitHub Actions](.github/workflows/ci.yml).

```
Browser or door app
  screen -> data hook -> API call -> /api/v1 route -> business rules -> database queries -> Postgres
                                                           \-> Qloo, Google Places, Ticketmaster, Claude, Wikidata, MusicBrainz
```

- **Each venue's data is private by design.** All venues share one database, and the database itself checks who may see each row (Postgres row level security). Door staff never see money, and guests only see public event pages.
- **Every number has a receipt.** A database rule refuses any number that is not in the saved Qloo answer it claims to come from.
- **Three locks on every action:** the page gate, the API, and the database. Hiding a button is never what stops someone.
- **Built to be run:** an administrator console with suspension, deactivation, a change history written by the database, and a read-only view of any user's screens for support.

| Technology                                                           | Version         | Used for                                                         |
| -------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| [Next.js](https://nextjs.org)                                        | 16.3.6          | The web app and its API (`/api/v1`)                              |
| [React](https://react.dev)                                           | 19.2.8          | The interface                                                    |
| [TypeScript](https://www.typescriptlang.org)                         | 5.9.3           | Strict types everywhere                                          |
| [Tailwind CSS](https://tailwindcss.com)                              | 4.3.3           | Styling, light and dark                                          |
| [shadcn/ui](https://ui.shadcn.com) on [Base UI](https://base-ui.com) | 4.21.0 / 1.8.0  | Interface components                                             |
| [Supabase](https://supabase.com/docs/reference/javascript)           | 2.117.2         | Postgres, sign-in, live updates                                  |
| [Anthropic SDK](https://docs.anthropic.com)                          | 0.131.0         | Claude Sonnet 5.5 for planning and checks, Haiku 5.5 for writing |
| [Zod](https://zod.dev)                                               | 4.6.5           | One set of rules for forms, the API and outside answers          |
| [TanStack Query](https://tanstack.com/query)                         | 5.104.0         | Data loading in the browser                                      |
| [Vitest](https://vitest.dev)                                         | 5.0.2           | Automated tests                                                  |
| [Expo](https://expo.dev) and React Native                            | SDK 57 / 0.86.3 | The door app in [`apps/door`](apps/door/README.md)               |

Every version is pinned exactly. The full design and the reasons behind it: [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md).

<details>
<summary><b>Project layout</b></summary>

```
src/app            Pages, layouts and /api/v1 routes (no business rules)
src/components     Shared interface components
src/config         Settings: site, roles, venues, series, pricing, outside services
src/lib            Connections to Supabase, Qloo, Google Places, Ticketmaster, Claude, Wikidata, MusicBrainz
src/modules        One folder per feature: rules, database queries, API calls, hooks and screens
apps/door          The door app (React Native, Expo)
supabase           Database changes, demo venues, and database tests
docs               Architecture, plans, roadmap, screenshots, and the original brief
```

</details>

<details>
<summary><b>Roles</b></summary>

| Role          | Who                        | Can                                                                                 |
| ------------- | -------------------------- | ----------------------------------------------------------------------------------- |
| Administrator | Runs Loudnight             | Everything; suspends venues, deactivates people, views any user's screens read only |
| Venue owner   | Whoever added the venue    | Everything at their venue, including the team and money                             |
| Venue manager | Invited by the owner       | Plans, series, nights, settings and takings                                         |
| Door staff    | Invited by the owner       | The guest list and check-ins, never money                                           |
| Guest         | Anyone with the event link | Reserve a place and check in                                                        |

</details>

## What is built today

| Area                    | Built and live                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing page            | A story in five scenes; each scroll moves one scene, and it zooms into the visitor's own country                                                                          |
| Venues anywhere         | Choose the country, then find the venue; time zone, town and currency come from the address                                                                               |
| The room                | What it can host (live music, DJs, poetry, comedy and more), seated or standing, and up to three quiet nights                                                             |
| Planning                | The six-step planner shows its work live and suggests three scored nights, with evidence behind every number and a plain chatbot answer beside it                         |
| Series and performers   | Four dated weeks; local acts first, stars and non-performers left out, budget labels, ready messages, booking                                                             |
| Promote                 | Posters, stories, banners and short videos made in the browser, with the performers' photos, a ticket QR code, Spanish text and captions                                  |
| Event pages and tickets | Guests reserve without an account; the ticket opens on any phone camera; each ticket checks in once                                                                       |
| The door and results    | Scan, find a name or count walk-ins; live counts on every phone; each night against break-even                                                                            |
| The door app            | A phone app for door staff ([`apps/door`](apps/door/README.md)): scans and uses up tickets, live count, walk-ins, and check-ins saved without signal until they send once |
| Administration          | Venues and people with details, every plan, change history, suspension, deactivation, and a read-only view of any user's screens                                          |
| Demo venues             | Finished plans anyone can open without an account                                                                                                                         |

Every plan, its status and its checks: [`docs/architecture/plans/README.md`](docs/architecture/plans/README.md).

## Roadmap

| Next                           | What it adds                                                                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Launch in the US and Europe    | Austin, New York, Chicago, London and Berlin first, where Qloo's data is deepest and venues pay by card                                               |
| The door app in the app stores | Tested on real phones, published for iPhone and Android, with a sound for each scan                                                                   |
| Paid tickets and payouts       | Card payments, a wallet for each venue, withdrawals, and tickets that can never be used twice                                                         |
| The door control room          | The owner messages door staff in real time, sees each arrival as it happens, gets the till's takings automatically, and can view the entrance cameras |
| The learning loop              | Each night's turnout decides the next one: keep it, change it or replace it                                                                           |
| Expansion                      | Africa next (Nairobi and Lagos, with mobile money such as M-Pesa), then Latin America and Asia                                                        |

Details, costs and order of work: [`docs/roadmap.md`](docs/roadmap.md).

## Run it yourself

You need Node 22 or newer and a Supabase project (hosted, or local with Docker and the [Supabase CLI](https://supabase.com/docs/guides/cli)).

```bash
npm install
cp .env.example .env.local     # fill in the keys
npm run check:connections      # says which keys work, without printing them
npm run dev                    # http://localhost:3000
```

<details>
<summary><b>Scripts</b></summary>

| Command                     | What it does                                                                  |
| --------------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`               | Development server                                                            |
| `npm run validate`          | Style checks, types, lint, formatting, tests and build. Run before every push |
| `npm run db:test`           | The database tests against a local database                                   |
| `npm run db:types`          | Regenerates the database types                                                |
| `npm run check:connections` | Checks that Supabase, Qloo, Google Places, Ticketmaster and Anthropic answer  |
| `npm run demo:precompute`   | Rebuilds the demo venues' plans                                               |
| `npm test`                  | Automated tests                                                               |
| `npm run format`            | Formats the code                                                              |

The door app: see [`apps/door/README.md`](apps/door/README.md).

</details>

**Contributing:** read [`CLAUDE.md`](CLAUDE.md) (every rule in it is required), pick the active plan in [`docs/architecture/plans`](docs/architecture/plans), and run `npm run validate` and `npm run db:test` before every push.

**More documents:** [`ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) (the design and why), [`plans`](docs/architecture/plans) (every feature's plan and status), [`roadmap.md`](docs/roadmap.md) (pricing, launch order, payments, the door app), [`investors.md`](docs/investors.md) (for investors), [`docs/reference`](docs/reference) (the original brief).

## Licence

MIT. See [`LICENSE`](LICENSE).
