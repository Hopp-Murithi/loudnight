# Plan 12: Event pages, RSVP and QR

Status: Built (Oct 14). Verified end to end on the hosted database; Lighthouse not yet run.
Depends on: 11
Phase: 4
Judging criteria: Design (the guest side is finished too), Potential Impact (people through the door)

## Goal

Each published night has a fast public page a guest can open from any post or QR: the poster, what to expect, time and place, RSVP in two fields, add to calendar, share. An RSVP returns a ticket page with a QR code the door can scan. Managers publish, unpublish and cancel nights; guests of a cancelled night see a clear notice.

## Brief coverage

"The event page with RSVP and QR code." Distribution: "Event page: public page per night with RSVP, add-to-calendar and share links." Feature table: "Event page + RSVP + QR: public page per night, RSVP capture, door check-in." Demo script 1:35 to 1:50: "Show the event page, an RSVP."

## Scope

In: publish, unpublish and cancel actions; `/e/[slug]` page; RSVP form and endpoint; ticket page `/e/[slug]/ticket/[code]`; QR generation; `.ics` download and Google Calendar link; share; Open Graph image from the poster; the night's public URL and QR in the launch kit; the "I'm here" door QR for self check-in (its page is plan 13).
Out: check-in handling and dashboard (plan 13).

## Design

- Publishing: `POST /api/v1/nights/[id]/publish`, `.../unpublish`, `.../cancel` (owner, manager; RLS). Publishing requires the event description asset; cancelling keeps the page live with a cancelled notice and stops RSVPs.
- Event page reads with the caller's anonymous client: `event_nights` (published or cancelled only: a migration widens the public select from `status = 'published'` to `status in ('published','cancelled')`, with `rls.sql` assertions), the venue's public columns, assets needed for display. Rendered on the server; `revalidate` on publish and edit.
- RSVP: `POST /api/v1/e/[slug]/rsvp` (`publicApiRoute`, per-IP and per-night limits from plan 16's limiter, honeypot field). Body: name (1 to 80), contact optional (email or phone, validated), party size 1 to 10, consent checkbox when contact given. The service generates `checkin_code` with `crypto.randomUUID()` (12 characters base32 from it), inserts through the anonymous client (RLS allows inserts into published nights), returns the code. Duplicate contact for the night returns a friendly conflict ("You're already on the list") with a "Show my ticket" path that requires the same contact.
- Ticket page `/e/[slug]/ticket/[code]`: the code is the secret; the page shows the QR (encoding `encore:checkin:<code>`), night, time, party size. Codes are unguessable (at least 60 bits). The page is `noindex`.
- QR: add a small pinned QR library that renders SVG on the server (ask first); no client-side canvas.
- Calendar: `.ics` built by a pure, tested helper with the venue's time zone; Google Calendar link builder.
- Privacy: a short notice under the form says what is stored and that only the venue sees it. Contacts are never shown publicly or to door staff beyond the name (door sees name and party size; plan 13).

## Screens

- **`/e/[slug]`** (max width 640px, single column at every width): poster image (feed size), title, date and time in the venue's zone, venue name and address with a map link, what to expect, RSVP form, Add to calendar, Share. Sticky "RSVP" button on phones that scrolls to the form. Cancelled: banner at top, form replaced with the notice. Past night: "This night has happened" with the next date in the series if published.
- **Ticket**: large QR (at least 240px, high contrast on white in both themes), code in text below, "Turn your brightness up at the door", Add to calendar.
- Errors: rate limited ("Too many tries from this network. Wait a minute."), validation inline.
- Lighthouse on the event page: performance 90 or more on mobile.

## Tests

- RSVP schema, contact validation, honeypot.
- Code generator length and alphabet; collision retry.
- `.ics` helper across DST, escaping commas and newlines.
- Service: duplicate contact path; cancelled and draft nights refused (RLS assertion and service test).
- Database: widened public select includes cancelled nights but never drafts; guests still read nothing back from `rsvps`.
- E2E (plan 17): guest RSVPs on a phone viewport and sees the ticket.

## Deliverables

- [x] Managers publish, unpublish and cancel nights; door staff cannot (published Union Pool's opening night from its card; RLS assertions for door staff)
- [x] Public event page loads logged out on a phone with poster, details, RSVP, calendar and share
- [x] RSVP returns a ticket with a scannable QR; duplicates handled kindly (a signed-out guest's RSVP stored; the ticket's QR decoded to its own code; duplicate contact tested in service and database)
- [x] Draft nights 404; cancelled nights show a notice and take no RSVPs (database assertions and service tests)
- [x] RSVP limited per IP (10 in ten minutes) and once per contact per night; the trap field refuses simple bots
- [ ] Mobile Lighthouse performance 90 or more on the event page
- [ ] Screen standard met for the event and ticket pages

## Revision, Oct 14: decisions made while building

- **One migration for plans 12 and 13** (`event_pages_and_door`), applied and checked with the full `rls.sql` on the hosted project.
- **The public face is copied onto the night when it is published**: `title` (the night's name), `blurb` (its pitch), `lineup` (booked acts, in booking order) and `published_at`. The event page reads only the night and the venue's public columns, so a private venue's plan, scores and costs are never exposed. Republishing refreshes them.
- **Cancelled nights are public** (status `published` or `cancelled`), so guests see the notice; drafts never are.
- **Contacts have their own table** (`rsvp_contacts`), readable by owners and managers only. Postgres cannot hide one column from door staff but not from managers, so the contact left `rsvps`. Door staff read names and party sizes.
- **`reserve_place`** (security invoker) writes the RSVP and its contact in one transaction under the guest's own rights. A second RSVP with the same contact for the same night is refused by a unique index.
- **The ticket needs no read-back.** Guests cannot read RSVPs, so the ticket page shows the night (public) and the QR for the code in its own link. The door looks the code up. A made-up code shows a QR that the door will not recognise.
- **No new QR library**: `qrcode-generator` (already pinned for the ad studio) draws the ticket as SVG on the server.
- **Calendar files are built in the browser** from a tested helper, so no extra route is needed.
- **Publish rules**: draft or cancelled to published; published to cancelled; published back to draft only while nobody has RSVP'd (otherwise cancel, so guests see a notice).

## Verification

`npm run validate`, `npm run db:test`; publish The Copper Room's first night, RSVP from a phone, scan the ticket QR with the phone camera to see the code, add it to a calendar, cancel the night and reload.

## Prompt

---

You are working on Loudnight. Follow `CLAUDE.md` exactly, sections 3 and 4 above all, because guests are not signed in. Read this plan, `publicApiRoute`, the `rsvps` policies and RSVP assertions in `supabase/tests/rls.sql`, and plan 11's asset schemas. Load the `supabase-postgres-best-practices` skill before the migration. Ask before adding a QR library.

Order: migration with assertions, pure helpers (code, `.ics`, calendar link) with tests, services and routes, pages. Apply the migration to the hosted project after local tests, run the advisors, rename the file to the recorded version. Run `npm run validate` and `npm run db:test`. Tick boxes only when verified. No long dashes. Do not commit unless asked.
