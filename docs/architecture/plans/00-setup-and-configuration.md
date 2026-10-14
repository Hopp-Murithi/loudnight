# Plan 00: Setup and configuration

Status: Done except the Qloo key (issued by the hackathon organisers; plan 02 runs the check when it arrives) and Vercel (plan 18).
Depends on: none
Phase: 1

## Goal

A codebase anyone can pick up and extend without asking questions: the stack installed and pinned exactly as the UNoN portal, the Loudnight brand applied in light and dark, the rules written down, the whole data model migrated with RLS and tested, quality checked by one command, and every external service reachable through one thin client.

## Scope

In: framework and UI setup, theme and mark, folder architecture, tooling, quality gates, documentation, the full database schema with RLS and its tests, demo venue seed, the HTTP, env, Supabase, AI, Qloo, Places and Ticketmaster layers, a health endpoint, the landing page, local Supabase, the hosted Supabase project, the connection checker.

Out: every product feature (plans 01 onward). Vercel deployment waits until the keys exist.

## Design

- Layered modular monolith. Layer rules and folder map in `CLAUDE.md`, reasoning in `ARCHITECTURE.md`.
- Same pinned versions as UNoN: Next.js 16.3.6, React 19.2.8, TypeScript 5.9.3, Tailwind 4.3.3, shadcn 4.21.0 on Base UI 1.8.0, Supabase JS 2.117.2 and SSR 0.12.7, Zod 4.6.5, TanStack Query 5.104.0, Anthropic SDK 0.131.0, Vitest 5.0.2. Packages UNoN used that Loudnight does not need yet (Leaflet, Recharts, Resend, TanStack Table) are left out until a plan needs them.
- Brand tokens in `src/app/globals.css`: copper `#A4361C`, spotlight `#E8A33D`, warm white, late-night ink in dark mode.
- Migrations: `identity_and_venues` (profiles, venues, venue team, settings, audit, viewer and access helpers), `agent_pipeline` (runs, steps, Qloo cache, concepts, evidence with the receipt trigger, talent, the run cap), `series_and_attendance` (series, nights, RSVPs, check-ins, realtime), `row_level_security` (grants, policies, read-only previews).
- `lib/http/upstream.ts` gives every external call a timeout, a Zod-checked shape and safe errors.

## Deliverables

Stack and tooling

- [x] Next.js 16.3.6, React 19.2.8, TypeScript strict; all dependencies pinned, Node 22+ enforced, `.npmrc` save-exact
- [x] Tailwind 4 and shadcn/ui primitives in `src/components/ui`, shared patterns copied from UNoN (`SectionCard`, `KpiCard`, `ToneBadge`, `IconButton`, `TextField`, `SubmitButton`, `FadeIn`, `BrandLoader`)
- [x] ESLint, Prettier, Vitest configured; `npm run validate` runs dashes, typecheck, lint, format check, tests and build
- [x] Security headers and a Content Security Policy in `next.config.ts`
- [x] `CLAUDE.md`, `AGENTS.md`, `ARCHITECTURE.md`, `README.md`, MIT `LICENSE`, plans folder with template and schedule

Server layers

- [x] Env validated with Zod, one schema per concern, secrets behind `server-only`, tested
- [x] `apiRoute`, `apiStreamRoute`, `publicApiRoute`, error envelope and database error mapping, tested
- [x] Supabase browser, server, admin and proxy clients; `proxy.ts` gate for `/venues`, tested
- [x] Anthropic, Qloo, Google Places and Ticketmaster clients over `fetchUpstream`; Qloo request hashing tested
- [x] `/api/v1/health` (public) and `/api/v1/me` (session) respond correctly

Database

- [x] Full data model from the brief, plus venue team roles and Preview-as helpers, in four migrations, plus a fifth adding covering indexes for the composite foreign keys
- [x] RLS on every table; `supabase/tests/rls.sql` passes locally (owner, manager, door, stranger, guest, administrator, preview, receipts, run cap)
- [x] `supabase db lint` reports no schema errors; `src/types/database.ts` generated from the schema
- [x] Three demo venues seeded in real US neighbourhoods (Williamsburg, East Austin, Logan Square)
- [x] All five migrations applied to the hosted project `hack2026`; security advisor clean; RLS test passing there (performance advisor shows only "unused index" notes, expected on an empty database)

Interface

- [x] Landing page reads demo venues from the database through service and repository, skip link, one `h1`
- [x] Checked in a real browser (headless Chrome through the DevTools protocol, true device widths) at 390, 768, 1280 and 1440px in light and dark: no horizontal overflow, one `h1`, theme follows the system, no console errors. Found and fixed: demo venue cards were three-up at 768px and crushed their titles; now 1 / 2 / 3 columns as plan 01's route map says

Open

- [x] Migration file named `20261012155931_composite_foreign_key_indexes.sql`; local and hosted histories list the same five versions; `supabase db reset`, `npm run db:test` (PASS) and `npm run db:types` done; local and hosted types have the same 15 tables and 13 enums
- [x] `CLAUDE.md` section 3: replace "venue_id leading column of composite indexes" with "venue_id indexed on its own; every composite foreign key `(parent_id, venue_id)` has a covering index in that order" (what the advisor taught us)
- [x] `CLAUDE.md` sections 4 and 12 and `ARCHITECTURE.md`: test fixtures for Qloo are synthetic and marked `_synthetic`, never saved real responses (Qloo's terms forbid their data in a public repository); private server-side caching has no time limit, so stale rows are refreshed, never deleted; `.probe/` ignored by git and Prettier
- [ ] `scripts/check-connections.ts` Qloo check confirmed against plan 02's probe findings (needs `QLOO_API_KEY`)
- [x] Hosted Auth settings done by hand (`ARCHITECTURE.md` section 10). Verified Oct 12 through the public `/auth/v1/settings`: anonymous sign-ins on. Site URL and password length are not exposed there; set by the user in the dashboard
- [x] Google Places, Ticketmaster, Anthropic and the hosted secret key in `.env.local`, which points at the hosted project. `npm run check:connections` on Oct 12: Supabase OK, Supabase service role OK, Google Places OK, Ticketmaster OK, Anthropic OK
- [ ] `QLOO_API_KEY` in `.env.local` and the Qloo line of `npm run check:connections` OK (key comes from the hackathon organisers)
- [ ] Vercel project created and environment set (plan 18)

## Verification

```bash
supabase start
npm run db:test          # PASS rls.sql
npm run validate
npm run check:connections
npm run dev              # open http://localhost:3000, /api/v1/health returns {"data":{"status":"ok"}}
```

## Prompt

Copy everything below the line into Claude Code.

---

You are working on Loudnight. Follow `CLAUDE.md` exactly, every rule is mandatory. Read `CLAUDE.md`, `docs/architecture/ARCHITECTURE.md` and this plan first.

Close the open items in Deliverables:

1. Do the migration rename and the two documentation fixes in Open, then rerun `npm run db:test` and `npm run validate`.
2. Ask the user to do the hosted Auth settings in `ARCHITECTURE.md` section 10 and confirm when done.
3. Ask the user for the four API keys and the hosted secret key. Write them into `.env.local` only, never print them, never put them in a tracked file. Point `.env.local` at the hosted project or keep the local stack, whichever the user prefers.
4. Run `npm run check:connections`. Every line must be OK. If Qloo fails, stop and report: it is the phase 1 gate.
5. Run `npm run validate`.
6. Open the app in a browser at 390 and 1440px in light and dark and fix anything that looks unintentional.
7. Tick a box only after you have seen it work, and update the status line here and in `plans/README.md`.

Do not commit unless the user asks. One-line comments only, and only when necessary. No long dashes anywhere.
