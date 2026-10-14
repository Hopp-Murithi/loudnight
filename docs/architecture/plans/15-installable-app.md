# Plan 15: The door app (React Native)

Status: Plan written (revised Oct 14 at the owner's request: a native app instead of an installable web app). Not started.
Depends on: 12, 13
Phase: after the hackathon core (the web door screen already works on any phone)
Judging criteria: Design (a complete product on the device the venue actually uses), Potential Impact (a door that never stops)

## Goal

Door staff open one app, sign in once, pick tonight's night and point the camera at tickets. A valid ticket turns the screen green with the guest's name and party size and is used up on the spot; a used, cancelled or wrong-night ticket turns it red and says why. The count and break-even line update live on every phone at the door. A dropped connection never loses an arrival: scans queue on the device and sync exactly once.

## Why native

The web door screen (plan 13) works, but at a busy door a native app is faster and steadier: instant camera start, continuous scanning without browser permission prompts, haptics and sound on each result, the screen kept awake, and an offline queue that survives the app being closed.

## What already exists (the app reuses it, never re-implements it)

- **Single-use tickets**: an RSVP's code checks in once. The database refuses a second arrival for the same RSVP; the API answers "already came in at 8:14 PM" instead of counting twice, even when two phones scan at once (plan 13, tested).
- **Rules live on the server**: door staff see names and counts, never money or contacts (RLS). The app never decides who may enter.
- **Realtime**: check-ins are published per night (`event_night_id=eq.<id>`), which is what the web dashboard listens to.
- **The QR holds the ticket URL** (`/e/<slug>/ticket/<code>`), so the app reads the code from the URL path and also accepts a typed code.

## Scope

In: an Expo app in `apps/door` (iOS and Android), sign in with the same Loudnight account, venue and night picker (door-staff venues only), camera scanning, manual code entry, find a guest by name, walk-ins with party size, live count against break-even, recent arrivals, an offline queue, haptics and sound, keep-awake, dark theme in the Loudnight look.
Out: planning, ads, money, settings (owners use the web app); push notifications (later).

## Design

- **Project**: Expo SDK (pinned), TypeScript strict, `expo-camera` (barcode scanning with QR only), `expo-haptics`, `expo-av` for the result sound, `expo-keep-awake`, `expo-secure-store` for the session, `@supabase/supabase-js` with a secure-store storage adapter, TanStack Query. Lives in `apps/door` with its own `package.json`; shared types are generated, not imported from the web app's server code.
- **Auth**: Supabase email and password sign-in in the app; the session token is kept in the secure store. API calls send `Authorization: Bearer <access token>`.
- **One server change**: the route wrappers accept a bearer token as well as the cookie session (`createServerSupabase` reads `Authorization` when present), so the existing `/api/v1/nights/:id/checkins`, `/door` and guest search work unchanged for the app. RLS, roles and the preview rules apply exactly as on the web.
- **Scanning**: a code is accepted once per second at most; the screen shows the result for 1.5 seconds, then scans again. Results: in (green, name, party size), already in (amber, first arrival time), not for tonight or cancelled (red, reason), not a Loudnight ticket (red). Each has its own haptic pattern and sound; everything is also in words for accessibility.
- **Offline queue**: when a request fails for network reasons (never on a 4xx), the scan is stored in SQLite with an idempotency key, the client time and the code or walk-in size. The banner says "3 arrivals waiting to sync". The queue retries when the connection returns and every 30 seconds. The API accepts an `Idempotency-Key` header and stores it with the check-in, so a replay records once; a code another phone already used resolves as "already in". Contact details are never stored on the device.
- **Live numbers**: the app subscribes to the night's check-ins over Realtime with the user's token and refetches the door view on each change; it never polls.

## Screens

1. Sign in (email, password, forgotten password opens the web reset).
2. Tonight: the venue's next or current night, a large count with the break-even meter, and three big buttons: Scan, Find a name, Walk-in (48px or more).
3. Scanner: full-screen camera, a frame, the last result card, and a manual code field.
4. Find a name: search the guest list, tap to check in.
5. Walk-in: party size stepper and Check in.

## Tests

- Code extraction from ticket URLs and typed codes (unit).
- Queue: enqueue only on network errors, replay with idempotency keys, never stores contacts (unit).
- API: bearer token accepted with the same roles and RLS; the same idempotency key twice records once (unit and `supabase/tests`).
- A real phone at a real door: two phones scan the same ticket; airplane mode, three scans, network back, three arrivals recorded once each.

## Deliverables

- [ ] Expo app signs in with a Loudnight account and lists only the venues where the person is on the team
- [ ] Scanning a valid ticket checks the guest in once; a second scan anywhere says when they first came in
- [ ] Wrong night, cancelled night and unknown codes are refused with a reason
- [ ] Walk-ins and find-a-name work from the app
- [ ] Count and break-even update live on every phone
- [ ] Offline scans sync exactly once; nothing personal is stored on the device
- [ ] Route wrappers accept bearer tokens with the same rules as cookies; idempotent check-ins tested
- [ ] Builds for iOS and Android through EAS; tested on one real phone of each

## Verification

`npm run validate` for the web changes, `npx expo-doctor` and the app's tests in `apps/door`, then the door test above on real phones.

## Prompt

---

You are working on Loudnight. Follow `CLAUDE.md` exactly. Read this plan, plans 12 and 13, `src/modules/door`, `src/lib/http/route.ts` and `src/lib/supabase/server.ts`.

Order: bearer-token support in the route wrappers with tests; the idempotent check-in API with a database test; then `apps/door` with Expo (sign in, tonight, scanner, find a name, walk-in, offline queue, realtime). Pin every version. Ask before adding EAS credentials or app store accounts. Tick boxes only when verified on a real phone. No long dashes.
