# Architecture: Loudnight

Written for whoever picks this up next. Read the summary, then use the rest as reference.

## 1. Summary

**Name: Layered Modular Monolith with shared-schema multi-tenancy (the tenant is the venue), enforced by Postgres Row Level Security, around a fixed-spine agent pipeline whose every number carries a receipt.**

In plain words:

- One Next.js application on Vercel, split into strict layers and one folder per business area. Supabase holds the data, the sessions and the live updates.
- Every venue's rows share one database. The database itself refuses to show a row to someone who should not see it, so the application cannot forget to filter.
- The planner is a pipeline of six fixed steps. Claude chooses which tools to call inside a step, never the order of steps. Runs are fast and predictable for judges, and still genuinely agentic.
- Every Qloo answer is cached in Postgres. Every claim with a number points at the cached answer and the exact JSON path that holds it, and the database refuses a claim whose number is not there.

Why it wins for this project: it is the smallest design that is still correct for real venues and honest under scrutiny ("how do we know it is not making this up?"). Nothing in it needs rebuilding to grow from one bar to a hospitality group.

## 2. What the brief asks for and where it lives

| Requirement (brief)                         | Where it is handled                                                                                                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two-minute onboarding, no signup for judges | Anonymous Supabase sessions; demo venues readable by anyone (`is_demo`). Plans 03, 09.                                                                                        |
| Neighbourhood taste fingerprint             | `modules/taste` over `lib/qloo`, cached in `qloo_cache` (private, refreshed after seven days, never exposed raw). Plans 02, 04.                                               |
| Competitor gap scan                         | `modules/gap` over Google Places nearby and Ticketmaster events on the target weekday. Plan 05.                                                                               |
| Three scored concepts with evidence chips   | `modules/concepts`: generation, Qloo re-check, validator, `evidence` rows with receipts. Plan 06.                                                                             |
| Score formula                               | `concepts.total_score`, a generated column: 40 x audience + 20 x novelty + 20 x venue fit + 20 x cost fit.                                                                    |
| Grounding rule                              | Validator in code plus the `evidence_requires_receipt` trigger in the database. Plans 06, 16.                                                                                 |
| Live agent trace                            | One server call per step, streamed as NDJSON; `run_steps` rows record each tool call. Plan 07.                                                                                |
| Generic AI vs Loudnight toggle              | A `generic` run mode: a plain model answer for the same venue, stored beside the Loudnight run. Plan 07.                                                                      |
| Preloaded demo venues, instant              | Three seeded venues; their plans are precomputed by the real pipeline, never typed in. Plan 09.                                                                               |
| 4-week series, talent, launch kit, ad brief | `modules/series`, `modules/talent` (Qloo first, Wikidata and MusicBrainz where Qloo is thin, each act vetted for home country and fame), `modules/promote`. Plans 10, 11, 32. |
| Venues anywhere, up to three quiet nights   | Country-first Google Places search; time zone, town, country and currency from the place; `venue_settings.quiet_nights`. Plans 29, 30, 32.                                    |
| Event page, RSVP, QR, door check-in         | Public pages and `publicApiRoute`; guests write, never read. Plans 12, 13.                                                                                                    |
| Learning loop and dashboard                 | Check-ins against break-even set the next night's decision (keep, tweak, swap). Plans 13, 14.                                                                                 |
| Abuse and cost control                      | Per-person run cap in the database, per-IP limits on public endpoints, Qloo cache reuse. Plans 07, 16.                                                                        |
| Open source, keys only in env               | MIT licence, `lib/env/server.ts` behind `server-only`.                                                                                                                        |
| The door on a phone                         | `apps/door`: an Expo (React Native) app for door staff that calls the same `/api/v1` routes with a bearer token. Plan 15.                                                     |
| Running the platform                        | `/admin`: overview, venues (suspend with a reason), people (deactivate), plans, audit log, Preview as. Plan 08.                                                               |

Carried over from the UNoN portal because they earned their place there: administrator **Preview as** (plan 08), the **audit log** page (plan 08), an app for door staff (plan 15, now planned as a React Native app), and the three-gate authorization model (section 4).

## 3. Layers

```
Browser
  component            UI only. Renders, handles events, calls hooks.
     |
  hook                 Data and state. TanStack Query, mutations, streams, realtime.
     |
  api.ts               The one place the browser calls the server (apiFetch, apiStream).
     |  HTTP  /api/v1/...
  proxy.ts             Session refresh, signed-in gate.
     |
  route.ts             Transport only. apiRoute / apiStreamRoute / publicApiRoute: auth, role, Zod, envelope, errors.
     |
  service              Business rules, pipeline steps, prompts, validation, audit.
     |            \
  repository        lib/qloo, lib/places, lib/ticketmaster, lib/ai   (fetchUpstream: timeout, shape check, safe errors)
     |
Supabase Postgres      RLS, constraints, composite keys, triggers, realtime.
```

Rules that make this work (also in `CLAUDE.md`):

- A layer calls only the layer directly below it.
- Services receive a `RequestContext` (`user` plus a Supabase client acting as that user) or, for guests, the caller's anonymous client. They do not know about HTTP.
- Each feature is a folder in `src/modules/<feature>`. To take over a feature, open one folder.

### Why this shape and not another

| Alternative                               | Why not                                                                                                              |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Free-roaming agent (model picks steps)    | Unpredictable latency and cost in front of judges, hard to stream, hard to test. A fixed spine keeps it explainable. |
| One long server request for the whole run | Hits the host's function time limit. One call per step, driven from the client and streamed, never does.             |
| Filtering by venue in application code    | One forgotten `where` leaks a venue's money. RLS makes the safe behaviour the only behaviour.                        |
| Trusting the model's numbers              | The brief's core promise is "no number without a receipt". The database enforces it, not a prompt.                   |
| An image model for posters                | Slow, inconsistent, off-brand. HTML/SVG templates rendered to PNG with Satori are fast and on-brand (plan 11).       |
| Microservices                             | One person, eighteen days. Modules already do not reach into each other, so a split later is mechanical.             |

## 4. Tenancy, roles and authorization

### Tenant

A `venue` is a tenant. Every venue-owned row carries `venue_id`, and every child row has a composite foreign key `(parent_id, venue_id)` so it cannot point at another venue's parent.

### Roles

| Where    | Role            | Sees                                                        | Can change                                     |
| -------- | --------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| Platform | `administrator` | Everything                                                  | Everything; previews anyone read only          |
| Platform | `owner`         | Venues they belong to, every demo venue, public event pages | Depends on their venue role                    |
| Venue    | `owner`         | The whole venue, money included, and its audit history      | Everything at the venue, the team, deleting it |
| Venue    | `manager`       | The whole venue, money included                             | Plans, series, nights, settings, spend         |
| Venue    | `door`          | Plans, guest list, check-ins. Never money                   | Check guests in, link RSVPs                    |
| Guest    | none            | Published event pages                                       | RSVP. Reads nothing back                       |

Anonymous visitors are real Supabase users (`is_anonymous`), so a judge or a curious owner gets a working session in one tap and can later add an email without losing their venue.

### One set of helpers decides visibility

All in the `private` schema, `security definer`, `search_path = ''`:

- `viewer_id()`: whose view this request reads as (section 5).
- `member_venue_ids()`, `managed_venue_ids()`, `owner_venue_ids()`: venues where the viewer holds those roles. Administrators hold every role everywhere.
- `readable_venue_ids()`: member venues plus every demo venue.

Every policy is built from these, wrapped as `(select ...)` so Postgres evaluates them once per statement.

### Three gates, each independent

1. `proxy.ts`: redirects visitors without a session away from `/venues`. Convenience only.
2. Route wrappers: verify the token (a browser's cookie session, or the door app's `Authorization: Bearer` token), read the profile, check the platform role, validate the body.
3. RLS: the last word. Even a bug in the two above cannot leak data.

### Suspending a venue

An administrator can suspend a venue with a reason (`venues.suspended_at`, `suspended_reason`, `suspended_by`). Its team keeps read access, but restrictive `no_insert_while_suspended` and `no_update_while_suspended` policies on every venue table refuse their writes, guests cannot RSVP or check themselves in, and the event page says it is not taking bookings. A trigger lets only administrators set or lift a suspension and records who did; the audit trigger records when. Tested in `supabase/tests/suspension.sql`.

### Deactivating a person

`profiles.is_active = false` (service role, audited as `person.deactivated`) makes every RLS helper ignore the person at once, and the auth admin API blocks their sign-in, so sessions end at their next refresh. Sign-in is blocked first, so a failure changes nothing.

## 5. Preview as

An administrator can open Loudnight exactly as any owner, manager or door person sees it, read only. This is the UNoN pattern, built in from the first migration:

- The server's Supabase client sends `x-encore-preview: <user id>` only when the signed-in person is an administrator with a valid preview cookie.
- `private.viewer_id()` honours the header only if the real caller is an active administrator and the target is an active non-administrator. Otherwise it returns `auth.uid()`. A preview can only narrow what an administrator sees.
- Every helper reads the viewer, so every policy follows without being touched.
- Restrictive `no_insert_while_previewing`, `no_update_while_previewing` and `no_delete_while_previewing` policies sit on every table. The route wrapper also refuses writes with a clear message, and the UI hides actions.
- The cookie `loudnight_preview` holds the person previewed and an expiry one hour ahead, signed with HMAC and the server secret `PREVIEW_COOKIE_SECRET`. A tampered or expired cookie is ignored. Signing out deletes it.
- The request context then carries `preview: { adminId, adminName }` and the previewed person as `user`, so pages, menus and figures are exactly theirs. A banner on every signed-in page says whose view it is, with "Exit preview".
- Starting (`POST /api/v1/admin/preview`) and ending (`DELETE /api/v1/preview`) are audited as `preview.started` and `preview.ended`. The database half is tested in `supabase/tests/rls.sql`.

## 6. Data model

| Table               | Holds                                                                                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `profiles`          | One per auth user, anonymous ones included: display name, platform role, anonymous flag, active flag                                                                                                                                                         |
| `venues`            | Public face: name, address, coordinates, type, time zone, country, town, currency, demo flag, suspension (when, why, by whom)                                                                                                                                |
| `venue_members`     | Who works where and as what. Exactly one owner, added by trigger in the same statement as the venue                                                                                                                                                          |
| `venue_settings`    | Capacity, capabilities, what the room hosts, seated or standing, up to three quiet nights (the first is `slow_night`), break-even headcount, talent budget, average spend, search radius                                                                     |
| `agent_runs`        | One planning run per venue and night, Loudnight or generic mode, status and timing                                                                                                                                                                           |
| `run_steps`         | Each tool call: step, tool, input, summarised output, latency, and the Qloo cache row it used                                                                                                                                                                |
| `qloo_cache`        | Request hash, canonical request, full response, fetch time, refresh-after time (seven days). Shared by all; private to the server                                                                                                                            |
| `concepts`          | Name, pitch, why it beats nearby, the four sub-scores, the generated total, estimated cost                                                                                                                                                                   |
| `evidence`          | Claim, value, the `qloo_cache` row and JSON path that prove it. Refused by trigger without a receipt                                                                                                                                                         |
| `talent_candidates` | An act for a night: Qloo entity or open record, source (night, area, both, Wikidata, MusicBrainz), tier, overlap, profile with home country and star flag, outreach draft or the owner's wording, booked time. Open-data acts can never carry a Qloo receipt |
| `open_data_cache`   | Wikidata and MusicBrainz answers, shared and server only, refreshed after a week                                                                                                                                                                             |
| `series`            | The chosen concept as a weekly series: weekday, start date, status                                                                                                                                                                                           |
| `event_nights`      | Four dates, each with a variation, generated assets, public slug, status, and the learning decision                                                                                                                                                          |
| `rsvps`             | Guest name, party size, server-generated check-in code (the ticket)                                                                                                                                                                                          |
| `rsvp_contacts`     | A guest's optional email or phone, kept apart so door staff never see it; owners and managers only                                                                                                                                                           |
| `night_spend`       | What a night took at the till, logged by an owner or manager                                                                                                                                                                                                 |
| `checkins`          | One row per arrival, optionally linked to an RSVP (one per RSVP: a ticket is used once), with the door app's key for walk-ins so a replay counts once                                                                                                        |
| `audit_log`         | Append only. Venue, team, settings, series and night changes, written by trigger in the same transaction                                                                                                                                                     |

## 7. The planning pipeline

Six steps, each its own server call:

1. **Scout the venue.** Google Places resolves the address to coordinates, type, hours, rating and photos.
2. **Read the neighbourhood.** Qloo insights at the venue's location and radius (default 2 km) across artists, films, TV, brands, places, books, podcasts and tags, plus the area's demographic skew. Output: the taste fingerprint.
3. **Find the gap.** Places lists nearby competing venues; Ticketmaster lists events nearby on the target weekday. Claude extracts the themes already covered.
4. **Generate concepts.** Claude combines two or three high-affinity signals from different domains, re-queries Qloo to confirm the overlap is real, makes six candidates and keeps three.
5. **Score and explain.** Each concept gets its four sub-scores; each evidence chip stores the Qloo request and response it came from. The validator drops any claim without a receipt.
6. **Plan and equip.** The chosen concept becomes a four-week series, a talent shortlist, a launch kit and an ad brief. Performers come from Qloo (fans of the night's tastes, the area's own favourites, the area's own sound), plus Wikidata and MusicBrainz where Qloo is thin; one check by the reasoning model gives each act a home country, a star flag and a kind of act, so household names and non-performers are left out and home-grown acts come first.

The client drives the steps in order and renders the stream; the server never holds a request open for the whole run. Every step writes `run_steps`, so the trace survives a reload and the "Powered by Qloo" panel lists every call.

## 8. ACID, concretely

- **Atomicity:** a venue and its owner membership are created in one statement (trigger). Every audited change and its audit row commit together.
- **Consistency:** enums, checks, composite foreign keys, the generated score, the receipt trigger and the one-owner index keep the data true whatever the application does.
- **Isolation:** RLS gives every request a venue-scoped view. Postgres MVCC isolates concurrent writes.
- **Durability:** Supabase managed Postgres with write-ahead logging and backups.

## 9. Security summary

- RLS on every table, with tested assertions for owners, managers, door staff, strangers, guests, administrators and previews.
- The service-role key is server only, used for agent output, the shared Qloo and open data caches, demo upkeep, service-side audit rows, and changing a profile's role or status.
- The preview cookie is HMAC-signed with `PREVIEW_COOKIE_SECRET` and honoured only for a real administrator; the database independently checks the same.
- Roles never come from user-editable metadata. Tokens are verified (`getClaims`), not just decoded.
- Inputs validated with Zod. Database and upstream errors are mapped to safe messages; URLs that carry keys are never logged.
- Security headers and a Content Security Policy in `next.config.ts`; the camera is allowed on our own pages only, for the door scanner.
- Fresh runs are capped per person in the database. Public endpoints get per-IP limits in plan 16, and session reads of `qloo_cache` are narrowed to server-built receipt slices.
- Qloo data stays private to the server: cached in Postgres (allowed with no time limit by the hackathon terms), shown to people only as receipt slices, and never written to the repository. Test fixtures are synthetic and marked `"_synthetic": true`; live probe output goes to the git-ignored `.probe/` folder.

## 10. Manual settings in the Supabase dashboard

The MCP tools cannot change Auth settings. Do these once for the hosted project (Authentication section):

1. Keep **Allow new users to sign up** and **Confirm email** on; Loudnight sends the confirmation itself through Resend, so Supabase's own email templates are never used.
2. Turn **Allow anonymous sign-ins** off. Owners have email accounts (plan 03); judges use the public demo pages, which need no session.
3. Set **Site URL** to the deployed URL, and add `http://localhost:3000` as a redirect for development.
4. Password minimum length 10; turn on leaked password protection if the plan allows it.
5. JWT expiry 3600 seconds or less.
6. Copy the **secret key** into `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and the host's environment.

## 11. Decision log

| Decision      | Choice                                          | Alternatives considered       | Reason                                                            |
| ------------- | ----------------------------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| Framework     | Next.js 16 App Router on Vercel                 | Remix, SvelteKit              | Hopp's existing stack: all eighteen days go to product, not setup |
| Backend       | Supabase (Postgres, Auth, Realtime)             | Custom API plus separate auth | RLS, anonymous sessions and realtime in one managed service       |
| Tenancy       | Shared schema, `venue_id`, `venue_members`, RLS | Owner column on venues        | Teams (door staff) and hospitality groups without a rewrite       |
| Sessions      | Anonymous sign-in, upgradeable to email         | Email sign-up first           | Judges and owners get a plan without an account                   |
| Agent shape   | Fixed six-step spine, tools chosen per step     | Free agent loop               | Fast, predictable, streamable, testable                           |
| Grounding     | Receipt trigger in the database plus validator  | Prompt instructions only      | The promise has to hold even if the code has a bug                |
| Models        | Sonnet 5.5 for reasoning, Haiku 5.5 for copy    | One model for everything      | Cost and latency on bulk copy                                     |
| Posters       | Canvas drawing in the browser (image and video) | Image model, server rendering | Instant, consistent, on-brand, no server cost                     |
| Performers    | Qloo first, open data where thin, model-vetted  | Qloo alone                    | Qloo's popularity is global and its local artist coverage uneven  |
| Preview as    | Signed cookie plus a header the database checks | Impersonating the session     | Read only by construction; can only narrow what is seen           |
| Door app      | React Native (Expo), plan 15                    | Installable web app           | Instant camera, haptics, offline queue that survives a restart    |
| API style     | Versioned route handlers `/api/v1`              | Server Actions                | Testable, documented, usable by a future POS integration          |
| Validation    | Zod, shared by form, API and upstream responses | Manual checks                 | One schema, three uses                                            |
| Session check | `getClaims()` then profile read                 | `getSession()`                | Verifies the token signature, and role is always fresh            |
| Next 16 gate  | `proxy.ts`                                      | `middleware.ts` (deprecated)  | Current convention                                                |
