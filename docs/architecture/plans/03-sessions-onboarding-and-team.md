# Plan 03: Accounts, venue onboarding and team

Status: Done, verified end to end against the hosted project on Oct 13. The UI pass is the user's (they review screens and report fixes).
Depends on: 01
Phase: 2
Judging criteria: Design (onboarding in about two minutes), Potential Impact (break-even comes from the owner)

Changed on Oct 12 at the user's request: owners sign up and sign in with email and password, with email verification and password reset, every email sent through Resend. Anonymous sessions stay supported by the database but are not offered in the interface. Judges still need no account: demo venues are public (plan 09).

## Goal

An owner signs up with name, email and password, verifies the email from a branded Resend email, signs in, and saves a venue in about two minutes: an address search fills the venue's name, coordinates, type and time zone from Google Places, and a short stepped form captures the quiet night, break-even headcount, what the space can host, capacity, talent budget and average spend. Owners can reset a forgotten password, change their details, and invite a manager or door staff by email.

## Brief coverage

"Set up (2 minutes). The owner gives the address, the slow night, a break-even headcount, what the space can host and a talent budget. Google Places fills in type, hours and photos automatically." Feature table: "Venue onboarding". Abuse and cost control: rate limits.

## Scope

In: sign up, email verification, resend verification, sign in, sign out, forgot and reset password, set password, account page (name, password), the rate limiter (built here, plan 16 extends it), `/venues` list, `/venues/new` onboarding, `/venues/[id]` overview frame, `/venues/[id]/settings`, `/venues/[id]/team` with email invites, the venue switcher wired to real memberships, Places search, the sidebar focus fix from plan 01.
Out: planning runs (plans 04 to 07), Preview as (plan 08), venue history page (plan 08), changing the sign-in email (later).

## Design

### Authentication (following UNoN: our own links, our own emails, a confirm page with a button)

| Flow                | Route                                                       | What happens                                                                                                                                                                                                                                                              |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign up             | `POST /api/v1/auth/signup` (public)                         | `auth.admin.generateLink({ type: "signup" })` creates the unconfirmed user without any Supabase email; we send "Verify your email" through Resend. An address that already has an account gets "You already have an account" instead. The response is the same either way |
| Verify              | `/auth/confirm` page, then `POST /api/v1/auth/confirm`      | The page shows a button that posts the token, so a mail scanner opening the link cannot use it. `verifyOtp` signs the person in; signup links go to `/venues`                                                                                                             |
| Resend verification | `POST /api/v1/auth/verification` (public)                   | A magic link (which also confirms the email) through Resend, only for unconfirmed accounts; same response for every address                                                                                                                                               |
| Sign in             | `POST /api/v1/auth/login` (public)                          | `signInWithPassword`. Wrong password: "Incorrect email or password." Unverified: a clear message with "Send the link again"                                                                                                                                               |
| Forgot password     | `POST /api/v1/auth/forgot-password` (public)                | Recovery link through Resend, sent after the response (`after()`), so timing never reveals an account                                                                                                                                                                     |
| Set password        | `/set-password`, `POST /api/v1/auth/set-password` (session) | Recovery and invite links set a password-pending cookie; until a password is saved every page leads back here                                                                                                                                                             |
| Sign out            | `POST /api/v1/auth/logout` (public)                         | Ends the session and clears the pending cookie                                                                                                                                                                                                                            |

- Links are built from `NEXT_PUBLIC_APP_URL`: `/auth/confirm?token_hash=...&type=signup|magiclink|recovery|invite`. They work once and expire with Supabase's OTP lifetime (one hour).
- Passwords: at least 10 characters, a letter and a number (the UNoN schema), also enforced by Supabase's minimum length.
- `next` redirects are same-site paths only.
- The proxy sends signed-in people away from `/login` and `/signup`, and signed-out people from `/venues`, `/account` and `/admin` to `/login?next=...`.

### Email (`lib/email`)

- `mailer.ts`: the only file that knows Resend (pinned `resend` package, as UNoN). `emailEnv()` validates `RESEND_API_KEY` and `EMAIL_FROM` on their own, so a missing email key never breaks a database write.
- `templates.ts`: one branded shell (copper header, plain text alternative, escaped content) and the templates `verifyEmail`, `accountExists`, `passwordReset`, `teamInvite` (new person: set your password), `addedToTeam` (existing account).
- Failures are logged with the reason and never reveal anything to the requester.

### Rate limiting (built here, extended in plan 16)

- Migration: `private.rate_limit_hits (bucket, hit_at)` and `private.consume_rate_limit(bucket, max_hits, window_seconds)`, with a `public.consume_rate_limit` wrapper executable by the service role only.
- `lib/http/rate-limit.ts`: `RateLimiter` interface, the database implementation, `clientIp(request)`; the bucket is the route plus a SHA-256 of the IP (raw IPs are never stored).
- Limits (`config/limits.ts`): sign up 5 per hour per IP, sign in 20 per 10 minutes, forgot password and resend verification 5 per hour, invites 30 per hour, Places search 60 per 10 minutes.

### Data

- Migration `accounts_and_venue_creation`:
  - `profiles.email` kept in step with `auth.users` by the existing triggers (insert and email change), so the team page can show who is who.
  - `public.create_venue(...)` (`security invoker`, so RLS applies) inserts the venue and its settings in one transaction and returns the id; the owner row still comes from the trigger.
  - The rate limiter above.
  - `rls.sql` assertions for all three.
- `CLAUDE.md` allowed service-role uses gain: creating auth users and generating auth links (sign-up, verification, recovery, invite), finding an account by email for invites, and consuming rate limits.

### Venues and team

- `modules/venues`: `venues.schemas.ts` (`venueOnboardingSchema`, dollars in the form, cents to the database), `venues.places.ts` (Place to name, coordinates, type and time zone; pure, tested), `venues.repository.ts`, `venues.service.ts` (`listMine`, `create`, `get`, `update`, `delete`), `api.ts`, hooks, components.
- `config/time-zones.ts`: US state code to IANA zone, with a select to correct it.
- `modules/team`: list (team sees itself), invite by email (owner only), change role, remove. Inviting an existing account adds the member and sends `addedToTeam`; a new address gets an account through an invite link and `teamInvite`.
- `POST /api/v1/places/search` (session): Places text search through the server; the key never reaches the browser.
- The `(app)` layout loads the person's memberships once; the sidebar picks the current venue from the address and the switcher lists them all.

## Screens

- `(auth)` frame: brand panel on desktop, single column on phones.
- `/signup`, `/login`, `/forgot-password`, `/check-email` (after sign up or reset, with "Send it again"), `/auth/confirm` (button, or a clear expired-link message), `/set-password`.
- `/venues`: venue cards with role and quiet night, "Add a venue", empty state leading to onboarding.
- `/venues/new`: four steps with a `Stepper`: find your venue, your quiet night, your space, money; a review step; `StickyActionBar` on phones.
- `/venues/[id]`: overview frame with the venue's facts (later plans fill it).
- `/venues/[id]/settings`: the same fields in cards; owners can delete the venue after typing its name.
- `/venues/[id]/team`: members with role badges; owners invite, change roles and remove.
- `/account`: display name, change password, sign out.

## Tests

- Schemas: sign up, sign in, password rules, onboarding boundaries, money transforms.
- `venues.places.ts` and time zone mapping.
- Auth service: sign up sends `verifyEmail`; an existing address gets `accountExists`; unverified sign in returns the verification error; reset and resend send nothing to unknown or already verified addresses and answer the same.
- Email templates escape content and include the link in HTML and text.
- Rate limiter: allows up to the limit, refuses after, keys by hashed IP.
- Routes: 401, 422 and 429 behaviour through the wrappers; proxy redirects for signed-in and signed-out people.
- Database: `create_venue` is atomic and refused for other owners; `profiles.email` stays in step; sessions cannot call the limiter.

## Deliverables

- [x] Sidebar focus visible for keyboard users (plan 01 finding): a solid inset outline on every focusable element in the sidebar; the user checks it visually
- [x] Sign up sends a branded verification email through Resend; the link signs the person in (real email read back from Resend, link followed, `/api/v1/me` returned the new account; the same link used twice is refused)
- [x] Unverified sign in is refused with a way to send the link again (`email_not_verified`; resend delivered "Your new Encore confirmation link"; nothing sent to an already verified address)
- [x] Forgot password sends a reset email; the link leads to the set-password form; the new password works (every page redirects to the form while pending; old password refused afterwards)
- [x] Responses never reveal whether an email has an account (same answer for unknown, existing and verified addresses; emails sent after the response); auth endpoints are rate limited per IP (unit tests and the database limiter assertions)
- [x] Onboarding saves venue and settings in one transaction; the creator is the owner (`create_venue`, asserted in `rls.sql`; Union Pool created from a live Places search)
- [x] `/venues` lists only the person's venues; a stranger's venue id renders the not-found page
- [x] Settings editable by owner and manager; door staff refused at the API and by RLS, and the settings page does not exist for them
- [x] Owner invites a manager and a door person by email; both can set a password and sign in (new address: invite email, set password, sign in as door staff; existing account: added with "You now work at")
- [x] Account page: change name and password, sign out (API verified; the user reviews the screen)
- [x] Tests above pass (128 unit tests); `npm run validate` and `npm run db:test` pass; migration applied to the hosted project. Security advisor: one intentional note (the limiter table has no policies because only the server function may touch it) and "anonymous access" warnings that clear when the user turns anonymous sign-ins off. Test accounts and the test venue were removed afterwards

## Verification

`npm run validate`, `npm run db:test`. Sign up with a real inbox, verify, sign in, add The Copper Room, invite a second inbox as door staff, set its password, sign in as door staff, then reset the owner's password.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read `CLAUDE.md`, `ARCHITECTURE.md` sections 4 to 6, the plans README, plan 01, this plan, and the UNoN reference for auth and email: `../UNoN-hackathon/src/modules/auth`, `../UNoN-hackathon/src/lib/email`, `../UNoN-hackathon/src/app/api/v1/auth` and `../UNoN-hackathon/src/app/(auth)`.

Order: migration with assertions, email layer with tests, rate limiter with tests, auth schemas, service and routes with tests, proxy, auth pages, then venues and team. Apply the migration to the hosted project only after local tests pass. Run `npm run validate` and `npm run db:test`. No long dashes. Commit only when the user asks, as the user alone.
