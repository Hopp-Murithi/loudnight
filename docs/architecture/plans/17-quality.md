# Plan 17: Quality: end-to-end tests, accessibility, performance, observability

Status: Not started
Depends on: 09, 13
Phase: 5 (the end-to-end harness is set up in phase 3 so later plans extend it)
Judging criteria: Design (complete and coherent), Technological Implementation (genuine, working, non-trivial)

## Goal

The paths judges and guests take are proven by automated end-to-end tests on phone and desktop viewports, every screen passes an accessibility audit, pages meet a performance budget, and when something breaks in production the logs say what, where and for whom, without leaking anything.

## Brief coverage

Submission checklist: "Live URL works on desktop and phone, in a logged-out browser", "3 preloaded demo venues return results instantly". Product design criterion: "Two-minute onboarding, preloaded venues, one-tap launch kit, mobile-first."

## Scope

In: Playwright setup, end-to-end suites, axe checks, a keyboard pass and a screen reader pass, Lighthouse budgets, bundle checks, structured server logging, a request id on every API response, an error boundary report, a pre-demo smoke checklist.
Out: load testing beyond a simple concurrency check of the run start and RSVP endpoints.

## Design

### End-to-end (Playwright, pinned; ask before adding)

- Projects: `phone` (390x844, touch), `tablet` (768x1024), `desktop` (1440x900); light and dark via `colorScheme`.
- Runs against the local stack (`supabase start`, seed, `next build && next start`) with upstream calls replaced by a test mode that serves synthetic fixtures through the same clients (`ENCORE_FAKE_UPSTREAMS=1`, refused in production by an env check).
- Suites:
  1. **Judge path**: landing, open a demo venue, Generic first, toggle to Encore, open a receipt, see the launch kit preview. Under 3 seconds to first content on the phone project with throttling.
  2. **Owner path**: start, onboard, plan (fake upstreams), choose a concept, series, launch kit, publish a night.
  3. **Guest path**: event page, RSVP, ticket.
  4. **Door path**: door screen check-in by code, duplicate, walk-in; dashboard updates live in a second context.
  5. **Roles**: door staff cannot reach settings or money; stranger gets 404; administrator preview is read only.
  6. **Responsiveness**: every route in plan 01's map at the three projects, asserting no horizontal scroll (`scrollWidth <= clientWidth`) and a visible `h1`.
- `npm run e2e` and `npm run e2e:ui`; not part of `validate` (too slow) but required before every deploy (plan 18).

### Accessibility

- `@axe-core/playwright` on every route in the map, light and dark; zero serious or critical violations.
- Keyboard-only pass of the four paths, recorded in this plan with any fixes.
- Screen reader pass (NVDA on Windows, VoiceOver on a phone) of the trace, a receipt sheet, the RSVP form and the door screen.
- Reduced motion pass.

### Performance budget

- Lighthouse mobile: landing, demo page and event page: performance 90 or more, accessibility 100, best practices 100, SEO 90 or more.
- First-load JavaScript per route recorded from `next build`; any route over 200 KB is investigated.
- Images through `next/image`; posters cached; fonts self-hosted through `next/font`.

### Observability

- `lib/log.ts`: structured `console.error` and `console.info` JSON lines (route, request id, user id hash, venue id, step, duration, status). Never keys, contacts, or full upstream bodies. Allowed in `lib/` only (update `CLAUDE.md`'s `console` rule accordingly).
- Request id: generated in the route wrappers, returned in an `x-request-id` header and in error envelopes, so a user's report can be matched to a log line.
- Run failures recorded on `agent_runs.error_message` (plain) and visible in the admin console (plan 08).
- Vercel log drains are not needed; Vercel's runtime logs plus the request id are enough for the hackathon.

### Pre-demo smoke checklist (kept in this plan, run before judging and after every production deploy)

1. Landing loads logged out on a phone.
2. Each demo venue opens under 3 seconds.
3. A receipt opens.
4. A fresh run starts (on the owner's own test venue) and finishes.
5. RSVP on a published demo night works; ticket QR shows.
6. `/api/v1/health` OK; `/api/v1/me` 401 logged out.

## Tests

The suites above, plus unit tests for `lib/log.ts` redaction and request id propagation through `apiRoute`, `apiStreamRoute` and `publicApiRoute`.

## Deliverables

- [ ] Playwright set up with three projects and fake upstreams; harness in place by phase 3
- [ ] Judge, owner, guest, door, roles and responsiveness suites pass
- [ ] Axe: zero serious or critical issues on every route, both themes
- [ ] Keyboard, screen reader and reduced motion passes done and recorded
- [ ] Lighthouse budgets met on landing, demo and event pages
- [ ] Structured logs with request ids, redaction tested
- [ ] Pre-demo smoke checklist passes on production

## Verification

`npm run validate`, `npm run e2e`, Lighthouse in Chrome devtools on the production URL, the smoke checklist by hand.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read this plan, plan 01's route map and the Screen standard, and the four user paths in plans 09, 03 to 07, 12 and 13. Ask the user before adding Playwright and axe.

Order: fake upstream mode with an env guard and tests, Playwright config and the judge path, then the other suites, then axe, then logging and request ids, then Lighthouse. Run `npm run validate` and `npm run e2e`. Tick boxes only when verified. No long dashes. Do not commit unless asked.
