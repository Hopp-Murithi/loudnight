# Plan 08: Administrator console and Preview as

Status: Console, venue suspension and deactivation built (Oct 14). Preview as UI, the runs list and detail sheets next. The database half of Preview as exists and is tested (plan 00: `private.viewer_id()`, restrictive no-write policies, assertions in `rls.sql`).
Depends on: 03, 13
Phase: 5
Judging criteria: Technological Implementation (trust and governance), Design (a complete product includes running it)

## Goal

An administrator runs Loudnight from one place: every venue and person, runs and their failures, the audit log, and the demo venues. They can open Loudnight exactly as any owner, manager or door person sees it, read only, to support them or check a problem. This carries over the UNoN portal's Preview as and audit log page, adapted to Loudnight's venue roles.

## Brief coverage

The brief's judges include one who "will look at trust and governance". "Open source", "abuse and cost control". UNoN features the user asked to keep: Preview as, highest-permission role, audit history.

## Scope

In: administrator creation script, `/admin` (overview), `/admin/venues`, `/admin/people`, `/admin/runs`, `/admin/audit`, `/venues/[id]/history` (venue audit for owners and managers), Preview as (start, banner, exit, expiry, audit), deactivate and reactivate a person, refresh demo venues (calls plan 09's precompute).
Out: acting on behalf of someone, previewing another administrator, editing other people's venues from the console.

## Design

### Administrators

- `scripts/seed-admin.ts` (service role): creates or promotes an account by email with `app_metadata.role = 'administrator'`; the trigger sets `profiles.role`. Never possible from the UI.
- Routes under `/admin` are guarded three times: proxy (role hint), `apiRoute({ roles: ["administrator"] })`, RLS.

### Preview as (following UNoN plan 10)

- `config/site.ts`: `PREVIEW_COOKIE = "encore_preview"`, `PREVIEW_HEADER = "x-encore-preview"`, `PREVIEW_MAX_AGE_SECONDS = 3600`.
- `modules/preview`: `preview.cookie.ts` (HMAC-signed with a server secret `PREVIEW_COOKIE_SECRET`, holds target id, role label and expiry; parse and verify tested), `preview.schemas.ts` (`{ userId }`), `preview.repository.ts` (`findTarget` through the administrator's client), `preview.service.ts` (`start`, `end`; both write audit rows with the service role: `preview.started`, `preview.ended`), `api.ts`, `hooks/use-preview.ts`, `components/preview-banner.tsx`, `components/preview-button.tsx`.
- `createServerSupabase({ previewUserId })` adds the header; `loadContext` reads the cookie only when the real caller is an administrator, loads the target profile, and returns `RequestContext` with `preview: { adminId, adminName }`.
- `apiRoute` refuses any non-GET during a preview with "You are previewing as someone else. Exit preview to make changes."; `ignorePreview` only on the start and end routes. Copy UNoN's tests for this behaviour.
- The proxy routes a previewing administrator as the target's role and keeps them out of `/account` and `/admin` pages that belong to the administrator.
- Banner at the top of every signed-in page: "Previewing as Jane, door staff at The Copper Room. Read only." with "Exit preview". Cookie expires after 60 minutes; sign out ends it.

### Console

- Overview KPIs: venues, people (anonymous and with email), runs today, failed runs today, Qloo calls today and cache hit rate, RSVPs and check-ins this week. Computed in `admin.service.ts` with bounded queries.
- Lists use a `DataTable` (add `@tanstack/react-table` pinned, as UNoN) with search, filters, sorting, a sticky header and a `DetailSheet` on row select. Paginated server side; never unbounded.
- Venue detail: team, settings summary, runs, nights, "Preview as owner". Person detail: venues and roles, last sign in, "Preview as", "Deactivate".
- Deactivate sets `profiles.is_active = false` with the service role, bans the auth user, audits it. RLS helpers already ignore inactive people.
- `/admin/audit` and `/venues/[id]/history`: paginated `audit_log` with actor, action, changed columns and time; no record contents are stored, so nothing private shows.

## Screens

- Tables at 1280 and 1440; at 390 and 768 the same data as cards with the key fields and a detail sheet. Filters collapse into a sheet on phones.
- Banner is opaque, sits above the top bar, and never covers content (the shell reserves its height).
- Empty states: "No failed runs today" with a check icon.

## Tests

- Cookie: signed, tampered, expired, wrong role.
- Context: non-administrator with a cookie ignored; administrator with a valid cookie reads as the target; preview of an administrator refused.
- `apiRoute`: reads pass, writes refused, `ignorePreview` routes work (as UNoN).
- Service: start and end audited; deactivate audited and bans.
- Database: existing preview assertions; add one for `audit_log` visibility to administrators.
- E2E (plan 17): administrator previews a door person, sees no money, a check-in attempt is refused, exits.

## Deliverables

- [ ] Administrator created by script only; `/admin` refused to everyone else at all three gates
- [x] Console lists venues, people and audit, paginated, with detail sheets (runs list still to come)
- [ ] Preview as owner, manager and door person shows exactly their menu, pages and figures
- [ ] Every write refused during a preview by the API and by the database
- [ ] Preview start and end audited; 60-minute expiry and sign out end it
- [x] Deactivate removes access at once and is audited
- [ ] Venue history page for owners and managers
- [ ] Screen standard met for every console screen

## Revision, Oct 14: the owner's asks

The owner asked for a role that oversees the whole platform, can disable venues and people, and manages everything easily. The administrator role is that role; this revision adds what was missing.

- **First administrator**: hoppmurithi@gmail.com was promoted on Oct 14 at the owner's request, by setting `profiles.role` on the hosted project (the existing trigger copied it to the sign-in account). `scripts/seed-admin.ts` remains the way to make further administrators; the UI never can.
- **Suspend a venue**: `venues.suspended_at` and `suspended_reason` (migration with `rls.sql` assertions). A suspended venue's team can still read it but cannot write to it (a restrictive policy on every venue table, like the preview policies), its public event pages show "This venue is not taking bookings", and RSVPs and self check-ins are refused. Suspending and lifting are audited and need a reason.
- **Deactivate a person** (already in scope) also signs them out everywhere through the auth admin API.
- **Console overview** adds what an operator watches: venues by country and currency, nights published this week, RSVPs and check-ins today (live), runs and their failures, Qloo calls and cache hit rate, and the money Loudnight will bill once billing exists (roadmap).
- **Manage easily**: every list has search, filters and one-click actions (preview as, suspend, deactivate, refresh demo) with a confirm that says what will happen.

New deliverables:

- [x] A first administrator for the owner (Oct 14)
- [x] Suspend and lift a venue, with a reason, audited, enforced by the database (migration `20261014095733_venue_suspension`, `supabase/tests/suspension.sql` passed on hosted; checked in the console, the team banner, a guest page and a direct RSVP)
- [x] Deactivating a person signs them out everywhere: sign-in is blocked first (so a failure changes nothing), RLS stops their reads at once, sessions end at their next refresh; audited as `person.deactivated`. Checked on a throwaway account, then reactivated and deleted.

## Verification

`npm run validate`, `npm run db:test`, then the E2E scenario above by hand and in plan 17.

## Prompt

---

You are working on Loudnight. Follow `CLAUDE.md` exactly. Read this plan, `ARCHITECTURE.md` section 5, the helpers in the first migration, the preview assertions in `supabase/tests/rls.sql`, and the UNoN reference `../UNoN-hackathon/docs/architecture/plans/10-admin-preview-as.md`, `../UNoN-hackathon/src/modules/preview`, `../UNoN-hackathon/src/lib/http/route.ts` and its tests. Adapt names; do not copy what does not fit.

Order: cookie and tests, context and route wrapper changes with tests, proxy, service and audit, script, then console pages. Ask before adding `@tanstack/react-table` and before creating the `PREVIEW_COOKIE_SECRET` variable. Run `npm run validate` and `npm run db:test`. Tick boxes only when verified. No long dashes. Do not commit unless asked.

Built Oct 14: `/admin` (overview counts and the latest changes everywhere), `/admin/venues` (search, suspend with a reason, lift), `/admin/people` (search, deactivate, reactivate; never yourself or another administrator), `/admin/audit` (every change, paginated). Lists are cards, 25 a page, at every width. Venues and people are tables on wider screens and cards on phones; each row opens a detail panel (venue: activity, room, team with who joined or is still only invited, suspend or lift; person: sign-in state, venues and roles, deactivate or reactivate). Not yet: Preview as in the interface (needs the `PREVIEW_COOKIE_SECRET` variable, to be agreed) and a runs list.
