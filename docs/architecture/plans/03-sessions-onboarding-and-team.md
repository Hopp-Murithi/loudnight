# Plan 03: Sessions, venue onboarding and team

Status: Not started
Depends on: 01
Phase: 2
Judging criteria: Design (two-minute onboarding), Potential Impact (break-even comes from the owner)

## Goal

An owner goes from the landing page to a saved venue in about two minutes, without creating an account. One tap starts an anonymous session. An address autocomplete fills the venue's name, coordinates, type and time zone from Google Places. A short stepped form captures the slow night, break-even headcount, what the space can host, capacity, talent budget and average spend. The owner can later add an email to keep the venue, change settings, and invite a manager or door staff.

## Brief coverage

"Set up (2 minutes). The owner gives the address, the slow night, a break-even headcount, what the space can host (stage, screen, sound, kitchen) and a talent budget. Google Places fills in type, hours and photos automatically." Feature table: "Venue onboarding: address autocomplete, slow night, break-even, capabilities, budget". "Judge gets a full plan without signing up."

## Scope

In: `/start`, anonymous sign-in, `/venues`, `/venues/new` (stepped onboarding), `/venues/[id]` overview frame, `/venues/[id]/settings`, `/venues/[id]/team`, `/account` (display name, add email, sign out), `/auth/confirm`, the venue switcher, per-IP limit on session starts, Places autocomplete and details (hours and one photo reference).
Out: planning runs (plans 04 to 07), Preview as (plan 08), venue history page (plan 08).

## Design

### Modules

- `modules/auth`: `auth.schemas.ts` (email upgrade, display name), `auth.service.ts` (`startSession`, `upgradeWithEmail`, `confirmEmail`, `signOut`), `api.ts`, `hooks/use-session.ts`, `components/start-card.tsx`, `components/add-email-form.tsx`.
- `modules/venues`: `venues.schemas.ts` (`venueOnboardingSchema` shared by form and API; dollars in the form, cents on the wire after a transform), `venues.repository.ts`, `venues.service.ts` (`create`, `list`, `get`, `updateSettings`, `delete`), `venues.places.ts` (maps a Place to name, coordinates, `VenueType`, time zone; pure, tested), `api.ts`, hooks, components (`onboarding-steps`, `place-autocomplete`, `capability-picker`, `night-picker`, `money-field`, `venue-card`, `venue-switcher`).
- `modules/team`: `team.schemas.ts`, `team.repository.ts`, `team.service.ts` (`list`, `invite`, `changeRole`, `remove`), `api.ts`, hooks, components (`member-list`, `invite-form`).

### API

| Method and path                                           | Access                     | Body                      | Notes                                                                  |
| --------------------------------------------------------- | -------------------------- | ------------------------- | ---------------------------------------------------------------------- |
| `POST /api/v1/session`                                    | Public, rate limited by IP | none                      | Anonymous sign-in; cookies set by `@supabase/ssr`                      |
| `DELETE /api/v1/session`                                  | Session                    | none                      | Sign out                                                               |
| `POST /api/v1/account/email`                              | Session (anonymous)        | `{ email }`               | Supabase `updateUser({ email })`; confirmation through `/auth/confirm` |
| `PATCH /api/v1/account`                                   | Session                    | `{ displayName }`         |                                                                        |
| `POST /api/v1/places/search`                              | Session                    | `{ query }`               | Max 5 results, debounced on the client; key never leaves the server    |
| `POST /api/v1/venues`                                     | Session                    | onboarding schema         | Venue then settings; owner row by trigger                              |
| `GET /api/v1/venues`                                      | Session                    | none                      | RLS decides; capped at 50                                              |
| `GET /api/v1/venues/[id]`                                 | Session                    | none                      | 404 when RLS hides it                                                  |
| `PATCH /api/v1/venues/[id]`                               | Session                    | partial onboarding schema | Settings need owner or manager (RLS)                                   |
| `DELETE /api/v1/venues/[id]`                              | Session                    | none                      | Owner only (RLS); confirm dialog with the venue name typed             |
| `GET /api/v1/venues/[id]/members`                         | Session                    | none                      | Team sees itself                                                       |
| `POST /api/v1/venues/[id]/members`                        | Session                    | `{ email, role }`         | Owner only; see invites below                                          |
| `PATCH` and `DELETE /api/v1/venues/[id]/members/[userId]` | Session                    | `{ role }` / none         | Owner only; never the owner row                                        |

Invites: the invitee needs a non-anonymous account. If none exists, the service creates it with the service role and sends the Supabase invite email (add "creating invited users" to the allowed service-role list in `CLAUDE.md` first). The member row is then inserted under the owner's session so RLS decides. Every invite is audited.

### Time zone

Derived from the venue's coordinates using the Places response (`utcOffsetMinutes` is not a zone), so: map the US state from the address to an IANA zone with a small pure table (`config/time-zones.ts`), tested, with a manual override select in settings.

## Screens

- **`/start`:** one card: "Plan your quiet night. No account needed." Primary "Start" and a line about keeping it later with an email. Honours a same-site `next`. Loading state while the session starts; error with retry.
- **`/venues/new`:** four steps with a `Stepper` header: 1. Find your venue (autocomplete, map-free; shows the matched address), 2. Your quiet night (weekday chips, break-even number with a helper "how many guests pay for the night"), 3. Your space (capability chips with icons and labels, capacity), 4. Money (talent budget, average spend per guest). A review screen before saving. At 390px one step per screen with `StickyActionBar` (Back, Continue). At 1280px the review shows two columns. Validation inline. Leaving mid-way keeps the draft in `sessionStorage` (per-viewer convenience only).
- **`/venues`:** venue cards with name, address, quiet night, plan status badge; "Add a venue". Empty state leads to onboarding.
- **`/venues/[id]`:** frame with the venue header and placeholders filled by later plans (next night, KPIs, plan status). Door staff are redirected to the door screen.
- **`/venues/[id]/settings`:** the onboarding fields in cards, saved per card; delete venue in a danger card for owners.
- **`/venues/[id]/team`:** members with role badges; owners see invite form and role changes; managers see the list read only.
- **`/account`:** display name; anonymous sessions see "Keep your venues: add your email"; sign out.

All screens meet the Screen standard.

## Tests

- Schemas: every boundary (break-even 1 to 100000, money transforms, required capabilities array, time zone in the table).
- `venues.places.ts`: Places types mapped to `VenueType` (bar, cafe, restaurant, night club to music venue, other).
- Services: create writes venue then settings and returns the venue; a settings failure surfaces as a validation error; list returns what RLS gives.
- Team service: invite of an existing account, of a new email, of an anonymous account (refused), role change, owner row protected.
- Routes through the wrappers: 401 without a session, 422 on bad bodies, 404 for a hidden venue.
- Database: extend `rls.sql` for invites (owner only), and settings updates by door staff refused.
- Rate limit on `POST /api/v1/session`: the route calls a `RateLimiter` interface; tested with a fake here, backed by plan 16's database store later.

## Deliverables

- [ ] "Plan my quiet night" on the landing page starts a session and opens onboarding
- [ ] Autocomplete fills name, coordinates, type and time zone; the Places key never reaches the browser
- [ ] Onboarding saves venue and settings in about two minutes (timed with a fresh browser)
- [ ] `/venues` lists only the caller's venues; a stranger's venue id returns 404
- [ ] Settings editable by owner and manager, refused for door staff at the API and by RLS
- [ ] An anonymous owner adds an email, confirms it, and keeps their venues
- [ ] Owner invites a manager and a door person; door staff land on the door screen and never see money
- [ ] Session starts limited per IP with a plain message
- [ ] All tests above pass; Screen standard met for every screen

## Verification

`npm run validate`, `npm run db:test`. In a private window: landing, Start, onboard The Copper Room's real address, reload, see it in `/venues`. A second private window cannot open it. Invite a door account and sign in as it.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read `CLAUDE.md`, `ARCHITECTURE.md` sections 4 to 6, the plans README (Screen and Test standards), plan 01's route map and components, this plan, and the existing `modules/venues` and `modules/auth`. Read the Next.js guide in `node_modules/next/dist/docs/` for any API you use, and the `supabase` skill for anonymous sign-in and `updateUser`.

Order: schemas and tests, pure helpers and tests, repositories, services and tests, routes, `api.ts` and hooks, components, pages. Ask the user before adding service-role invites, and update `CLAUDE.md` first if approved. Run `npm run validate` and `npm run db:test`, then check every screen at four widths in both themes. Tick boxes only when verified. No long dashes. Do not commit unless asked.
