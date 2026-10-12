# Plan 13: Door check-in, live dashboard and measurement

Status: Not started
Depends on: 12
Phase: 4
Judging criteria: Potential Impact (proof the night worked, in the owner's own numbers), Design (works at a busy door on a phone)

## Goal

On the night, door staff check guests in fast: scan a ticket QR, search the guest list, or tap "Walk-in". Guests can also check themselves in by scanning the door QR. The owner sees RSVPs, check-ins, show-up rate and distance to break-even update live, logs spend if they want, and sees the money the night made against the break-even they entered at onboarding.

## Brief coverage

"Run the night. Guests scan the QR code at the door to check in. The owner logs spend if they want." "Measurement. Every RSVP and every QR check-in at the door is recorded per night. The dashboard shows RSVPs, check-ins, show-up rate and distance to break-even." "Unit logic for the pitch. A venue that adds 30 guests to one weekly night, at roughly $20 spend each, gains about $2,400 a month. The demo should show this calculation from the owner's own break-even input." Demo script 1:35 to 2:00.

## Scope

In: `/venues/[id]/door` (door screen), `/e/[slug]/here` (guest self check-in), check-in endpoints, the Guests and Results tabs on `/venues/[id]/nights/[nightId]`, `/venues/[id]/results` (across the series), `/venues/[id]` overview KPIs, Realtime updates, spend logging, the break-even calculator.
Out: the keep, tweak or swap decision (plan 14); offline door mode (plan 15).

## Design

### Check-in

- Door screen picks tonight's published night for the venue automatically (or lets staff choose if two exist).
- Scan: camera via `BarcodeDetector` where supported, falling back to a small pinned decoder library (ask first); the camera is allowed by the CSP and `Permissions-Policy: camera=(self)`. Manual code entry always available.
- `POST /api/v1/nights/[id]/checkins` (team, RLS): `{ code }` links the RSVP and records party size; `{ walkIn: true, partySize }` records a walk-in. A second scan of the same code returns "Already checked in at 20:14" (unique `rsvp_id`).
- Guest list search for staff: by name, never showing contact details to door staff (the service selects name, party size, status only; a database view `rsvps_door` with `security_invoker` exposes only those columns to door staff, or column grants; decide in the migration and assert in `rls.sql`).
- Self check-in: `/e/[slug]/here` with "I'm here" and party size; `POST /api/v1/e/[slug]/here` (`publicApiRoute`, per-IP limited, one per device per night via a cookie, only during the night's window from one hour before to six hours after start).
- Spend: per arrival with `PATCH /api/v1/checkins/[id]`, or a night total with `POST /api/v1/nights/[id]/spend` (owner, manager). The night total lives in a new table `night_spend (venue_id, event_night_id, spend_cents, noted_by, created_at)` with a composite foreign key, managers-only RLS for every verb, the preview policies and `rls.sql` assertions. Never a column on `event_nights`, which guests can read. Door staff refused at the API and by RLS.

### Measurement (pure `attendance.metrics.ts`, tested)

- RSVPs (people = sum of party sizes), check-ins (people), show-up rate = RSVP holders who checked in divided by RSVP holders, walk-ins, distance to break-even = break-even headcount minus people checked in, revenue estimate = people times average spend (or logged spend when present), extra revenue against a baseline the owner enters (optional, default zero).
- Calculator: "If this night adds N guests every week at $S each, that is $X a month", with N and S editable sliders defaulting to tonight's numbers and the venue's average spend. Shown against Encore's price band ($49 to $99) as "pays for itself N times".
- Realtime: subscribe to `rsvps` and `checkins` filtered by `event_night_id`, remove the channel on cleanup, rebuild on `TOKEN_REFRESHED` (UNoN's lesson). Door staff get counts only.

## Screens

- **Door screen** (48px targets, high contrast, works one-handed): big live count "32 of 40 to break even" with a `MeterBar`; three large buttons: Scan, Search, Walk-in; last five arrivals list; full-screen scanner with a clear frame and a cancel button; success and duplicate feedback both as text and icon, with a short vibration where supported. At 768 (tablet at the door) the scanner and the list sit side by side.
- **Guests tab**: RSVPs with name, party size, status (checked in or not), search; managers see contact details, door staff do not.
- **Results tab** and `/venues/[id]/results`: KPI row (RSVPs, check-ins, show-up rate, break-even distance) as `KpiCard`s (1 / 2 / 4 columns), per-night table (cards on phones), spend entry for managers, the calculator.
- **Overview** `/venues/[id]`: next night card, last night's result, plan status.
- **Self check-in** page: one big button, party size stepper, success screen "Enjoy the night".
- States: no published night tonight (door screen explains and links to the series), camera denied (manual entry front and centre), offline (banner; actions disabled until plan 15).

## Tests

- Metrics helpers with worked examples, including the brief's $2,400 example (30 extra guests, $20, four weeks: $2,400).
- Check-in service: valid code, unknown code, duplicate, walk-in, wrong night's code.
- Self check-in window and one-per-device cookie.
- Door privacy: door staff never receive contact fields (service test and `rls.sql`).
- Realtime hook subscribes with the filter and cleans up (React Testing Library with a fake channel).
- E2E (plan 17): two browser contexts, guest RSVPs, door checks in by code, dashboard count updates without reload.

## Deliverables

- [ ] Door screen scans, searches and records walk-ins; duplicates are clear
- [ ] Guests can self check-in during the night's window only
- [ ] Dashboard and door count update live without reload
- [ ] Show-up rate, break-even distance and revenue estimate correct against worked examples
- [ ] Calculator reproduces the brief's unit logic from the owner's own inputs
- [ ] Door staff never see contact details or money; managers log spend
- [ ] Screen standard met, with 48px targets on door screens

## Verification

`npm run validate`, `npm run db:test`; a phone as the door and another as a guest: RSVP, scan, walk-in, self check-in; watch the laptop dashboard update; log spend as the owner; try spend as door staff and see it refused.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read this plan, plan 12, the `checkins` and `rsvps` policies and assertions, and UNoN's realtime hook pattern in `../UNoN-hackathon/src/modules/notifications/hooks/use-notifications.ts`. Load the `supabase` skill for Realtime and the `supabase-postgres-best-practices` skill for the door view or grants. Ask before adding a QR decoder library.

Order: metrics helpers with tests, migration for door privacy and spend with assertions, services and routes, realtime hook, then the door screen, tabs and calculator. Run `npm run validate` and `npm run db:test`. Test on a real phone camera. Tick boxes only when verified. No long dashes. Do not commit unless asked.
