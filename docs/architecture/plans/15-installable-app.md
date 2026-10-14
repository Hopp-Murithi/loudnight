# Plan 15: Installable app for door staff

Status: Not started
Depends on: 13
Phase: 5
Judging criteria: Design (a complete product on the device the venue actually uses)

## Goal

Loudnight installs from the browser on a phone or tablet, so door staff open the door screen with one tap from the home screen and owners keep tonight's numbers close. A dropped connection at the door does not lose a check-in: scans made offline queue on the device and sync when the connection returns. As in UNoN, no venue page or API response is ever cached on the device.

## Brief coverage

"Mobile-first". "Run the night. Guests scan the QR code at the door to check in." Carried over from UNoN at the user's request: the installable app (UNoN plan 11).

## Scope

In: manifest, icons from `public/logo.svg`, a hand-written service worker, a branded offline page, an install card for signed-in users (at most once every 25 minutes, never after three dismissals), "Install app" in the account menu, shortcuts ("Door", "Tonight"), an offline queue for door check-ins.
Out: web push (needs VAPID keys and a subscriptions table), offline guest pages.

## Design

- Follow UNoN: `src/app/manifest.ts` built from `config/site.ts` and a new `config/pwa.ts`; `public/sw.js` with cache-first for `/_next/static` and icons, network-first navigations falling back to `offline.html`, and no caching of `/api` or pages; `public/install-capture.js` loaded before the app; `modules/pwa` with the prompt rules as pure, tested functions; the worker served with `Cache-Control: no-cache` and its own CSP; the proxy matcher skips the manifest, worker, capture script and offline page.
- Icons: `scripts/generate-app-icons.mjs` (as UNoN) producing 192, 512 and maskable 512 from the mark; screenshots for the richer install sheet (narrow door screen, wide dashboard).
- Offline door queue: when a check-in request fails for network reasons, the door hook stores `{ nightId, code | walkIn, partySize, at, idempotencyKey }` in IndexedDB (per device, cleared after sync), shows "3 check-ins waiting to sync", and retries on `online` and every 30 seconds. The API accepts an `Idempotency-Key` header and a client timestamp, so a replay never double counts; codes already checked in by another device resolve as duplicates. Contact details are never stored offline (codes and counts only).
- Install card shown only in the signed-in shell, never during a preview.

## Screens

- Install card: bottom sheet on phones, small card on desktop; iOS shows the three Add to Home Screen steps.
- Offline page: brand, "You're offline. Check-ins you make on the door screen will sync when you're back."
- Door screen sync badge with count and a "Sync now" button.

## Tests

- Prompt rules (UNoN's cases adapted).
- Queue: enqueue on network error only (not on 4xx), replay with idempotency keys, duplicate resolution, never stores contact fields.
- API idempotency: same key twice records once.
- Lighthouse installability.

## Deliverables

- [ ] Installs on Android Chrome and desktop Chrome and Edge; iOS shows the steps
- [ ] Opens standalone with the Loudnight icon and theme colour; shortcuts work
- [ ] Offline navigation shows the offline page; no page or API response cached
- [ ] Door check-ins made offline sync exactly once when back online
- [ ] Install card rules tested; signed-in only, never in preview
- [ ] Screen standard met

## Verification

`npm run validate`, `npm run build && npm start`, install on a phone, airplane mode at the door screen, scan two tickets, turn the network back on, watch them sync once.

## Prompt

---

You are working on Loudnight. Follow `CLAUDE.md` exactly. Read this plan and UNoN's `docs/architecture/plans/11-installable-app.md`, `src/modules/pwa`, `public/sw.js`, `public/install-capture.js`, `src/app/manifest.ts` and `scripts/generate-app-icons.mjs` in `../UNoN-hackathon`. Adapt names, brand and rules.

Order: manifest and icons, worker and offline page, proxy and headers, install card with tests, idempotent check-in API, offline queue with tests. Run `npm run validate`. Test on a real phone. Tick boxes only when verified. No long dashes. Do not commit unless asked.
