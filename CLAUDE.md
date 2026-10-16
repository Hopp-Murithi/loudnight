# CLAUDE.md

Rules for ALL code in this repository. They are mandatory. Code that breaks a rule is invalid, even if it works.

@AGENTS.md

## What this is

Loudnight: an AI programming director that fills a venue's empty nights. An owner enters their address and slow night; Loudnight reads the neighbourhood's taste through Qloo, finds what nobody nearby runs, invents a recurring event backed by evidence, finds talent, produces the launch kit, and measures who came. Requirements live in `docs/reference/encore-system-brief.pdf` (text copy beside it). Hackathon submission target: Oct 29, 2026.

Roles. Platform: `owner` (everyone, anonymous visitors included) and `administrator`. Inside a venue (`venue_members`): `owner`, `manager`, `door`. Guests on event pages have no account.

Stack: Next.js 16 (App Router, route handlers under `/api/v1`), React 19, TypeScript strict, Tailwind v4 + shadcn/ui (Base UI), Supabase (Postgres, Auth with anonymous sign-in, Realtime), Anthropic Claude, Qloo Insights, Google Places (New), Ticketmaster Discovery, Wikidata and MusicBrainz (open data for performers), Deezer and iTunes (performer pictures), Zod, TanStack Query, Vitest.

Architecture: **Layered modular monolith with shared-schema multi-tenancy (the tenant is the venue) enforced by Postgres RLS, and an agent pipeline whose every number carries a receipt.** Full reasoning in `docs/architecture/ARCHITECTURE.md`.

## 1. Where code goes

```
src/
  app/                    Routing only. Thin pages, layouts, route handlers. No logic.
    api/v1/**/route.ts    One line per verb: apiRoute / apiStreamRoute / publicApiRoute -> service
  proxy.ts                Session refresh and the signed-in gate (a first gate, not the security boundary)
  components/
    ui/                   shadcn primitives. Generated. Do not hand edit beyond theming.
    forms/ layout/ shared/  Reusable, feature-agnostic UI (fields, brand, cards, badges, loader)
  config/                 Constants: roles, site, venues, journey, ai, integrations. No logic beyond tiny pure helpers.
  lib/
    env/                  Zod-validated env. `public.ts` (browser safe) and `server.ts` (secrets, one schema per concern)
    supabase/             browser, server (RLS), admin (service role), proxy clients
    http/                 errors, route wrappers, client fetch, stream, upstream. The only place status codes are decided
    ai/ qloo/ places/ ticketmaster/ wikidata/ musicbrainz/ deezer/ itunes/   One thin client per external service. No business logic.
  modules/<feature>/      One folder per business area. Everything about the feature lives here.
    <feature>.schemas.ts      Zod schemas and types shared by client and server
    <feature>.repository.ts   Database access only. Server only.
    <feature>.service.ts      Business rules and orchestration. Server only. Framework free.
    api.ts                    Browser calls to /api/v1 (via lib/http/client). The frontend "service" layer.
    hooks/                    React hooks: data, mutations, realtime. The only callers of api.ts.
    components/               UI only. Calls hooks. Nothing else.
  types/database.ts       Generated from Supabase. Never edit by hand.
apps/door/                The React Native (Expo) door app: its own package.json and tooling; calls /api/v1 with a bearer token.
supabase/migrations/      Every schema change, in order. seed.sql = demo venues. tests/*.sql = database rule tests.
scripts/                  check-dashes, check-connections (day-one API gate), run-db-tests
tests/                    Test setup and stubs. Unit tests sit beside the code as `*.test.ts`.
docs/architecture/        ARCHITECTURE.md and plans/. docs/reference/ = the Loudnight brief.
```

Dependency direction is one way: `component -> hook -> api.ts -> /api/v1 route -> service -> repository -> Supabase`.
External calls go `service -> lib/<service>/client`. A layer may only call the layer directly below it. Never skip, never reverse.

## 2. Layer rules

1. **Components = UI only.** Render, handle events, call hooks. No `fetch`, no Supabase, no filtering/reducing/mapping data beyond simple display, no business rules.
2. **Hooks = data and state.** All fetching, mutations, caching, streams and realtime subscriptions live here. Hooks call `api.ts`, never `fetch` directly.
3. **`api.ts` = the only browser to server call site** (through `apiFetch` or `apiStream`).
4. **Route handlers = transport only.** Parse, authorize, call one service, return. Wrap with `apiRoute`, `apiStreamRoute` or `publicApiRoute`. No logic in `route.ts`.
5. **Services = business logic.** Decisions, orchestration, scoring inputs, prompts, audit. Receive `RequestContext` (`{ user, supabase }`), or a `ServerSupabase` for public flows. Never import from `next/*` request APIs.
6. **Repositories = queries only.** No decisions. Wrap results with `unwrap()`.
7. **External clients (`lib/qloo`, `lib/places`, `lib/ticketmaster`, `lib/ai`) = transport only.** They go through `fetchUpstream` (timeout, Zod-checked shape, safe errors). Caching Qloo answers is the taste repository's job, not the client's.
8. **Server pages may call services directly** (they are the delivery layer) but must contain no logic of their own.
9. Business logic (scores, grounding, break-even, tenant scoping) is server side only. The frontend never re-implements it.
10. Shared logic appearing twice must be extracted to `lib/`, a module service, or a hook. DRY is not optional.

## 3. Tenancy, roles and previews

- The tenant is the `venue`. **The frontend never filters by venue membership.** The database decides via RLS.
- Use the caller's client (`ctx.supabase`, or the `supabase` that `publicApiRoute` passes) for every read and write so RLS always applies.
- One set of helpers decides access, all resolving the viewer through `private.viewer_id()`: `member_venue_ids()` (owner, manager, door), `managed_venue_ids()` (owner, manager), `owner_venue_ids()`, `readable_venue_ids()` (member venues plus every demo venue). Administrators hold every role everywhere. Reuse them; never write a new membership check.
- Every new venue table MUST have: `venue_id` indexed on its own, a composite foreign key `(parent_id, venue_id)` to its parent so rows cannot point across venues, a covering index on `(parent_id, venue_id)` in that order for every such key (the performance advisor flags any that is missing), RLS enabled, policies built from the helpers above, explicit `GRANT`s (column lists for anything a session may insert or update), the three `no_*_while_previewing` restrictive policies, the `no_insert_while_suspended` and `no_update_while_suspended` restrictive policies (a suspended venue writes nothing), and assertions in `supabase/tests/rls.sql`.
- Money (`venue_settings`, `spend_cents`) is for owners and managers only. Door staff see guest lists and check-ins, never money, never the plan editor.
- Roles live in `profiles.role` and `venue_members.role`. **Never** in `user_metadata`. `app_metadata.role` is a routing hint copied by trigger; never trust a JWT claim for data access.
- **Preview as.** An administrator can read Loudnight exactly as any non-administrator sees it. The server sends `x-encore-preview: <user id>`; `private.viewer_id()` honours it only for a real, active administrator and a non-administrator target. A preview only ever narrows, and nothing can be written while one is active (restrictive policies on every table, plus the route wrapper refuses writes; only the end-preview route passes `ignorePreview`). The preview is a one-hour `loudnight_preview` cookie signed with `PREVIEW_COOKIE_SECRET`; signing out deletes it. Starting and ending a preview is audited.
- **Suspension and deactivation.** Only administrators suspend a venue (with a reason) or deactivate a person, from `/admin`. A suspended venue's team reads but writes nothing; deactivating blocks sign-in first, then sets `profiles.is_active = false`.
- The service-role client (`createAdminSupabase`) is allowed only for: creating auth users and generating auth links (sign-up, confirmation, reset, team invites; all in `modules/auth/server/identity.ts`), finding an account by email for an invite or a reset, consuming rate limits (`lib/http/rate-limit.ts`), writing agent output (`agent_runs`, `run_steps`, `concepts`, `evidence`, `talent_candidates`), reading and writing the shared `qloo_cache` and `open_data_cache`, maintaining demo venues and their precomputed plans, writing service-side audit rows, changing a profile's role or status, and for the administrator console reading people's sign-in status and blocking or unblocking sign-in (`modules/auth/server/identity.ts`). Justify every other use in review.
- Guests: RSVPs go through `publicApiRoute` with the caller's client. Guests can reserve a place on a published night and read nothing back. Only the venue's team checks guests in, and only on the night (`door.window.ts`, the `checkins_on_the_night` trigger). The server generates check-in codes.

## 4. Security rules

- Validate every input at the edge with Zod (`body` option on the route wrappers). Reuse the same schema in the form.
- Authorization is enforced three times: proxy (fast gate), route wrapper roles (API), RLS (data). Never rely on hidden buttons or menu items.
- Secrets: `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `QLOO_API_KEY`, `GOOGLE_PLACES_API_KEY`, `TICKETMASTER_API_KEY`, `PREVIEW_COOKIE_SECRET` are server only, read through `lib/env/server.ts`, which imports `server-only`. Never prefix them with `NEXT_PUBLIC_`. Never log them or a URL that carries one. Never commit `.env*` (only `.env.example`).
- No new route handler without a role decision. If public, use `publicApiRoute` and say why in one line.
- Errors: never leak database messages, upstream messages, stack traces or keys. Map with `fromDatabaseError`; upstream failures become `upstreamFailed(service)`; unexpected errors become a generic 500.
- `redirect`/`next` params must be same-site paths (`/x`, never `//x` or absolute).
- SQL: `SECURITY DEFINER` functions live in the `private` schema, set `search_path = ''`, and are never exposed. Use `SECURITY INVOKER` unless RLS recursion forces otherwise.
- Audit: changes made under a session are audited by database triggers (atomic). Service-role actions call the audit writer inside the same service method.
- Abuse and cost: fresh planning runs are capped per person in the database (`EA429`). Public endpoints (RSVP, check-in, run start) are rate limited per IP before they reach the database. Qloo answers are reused from `qloo_cache` and refreshed after seven days. Qloo allows private server-side caching with no time limit, so a stale row is refreshed, never deleted: receipts must outlive freshness.
- Pin dependency versions (`.npmrc` has `save-exact`). Commit the lockfile. Run `npm audit` before releases.
- CSP and security headers live in `next.config.ts`. Adding an external origin (images, scripts, sockets) means adding it there, deliberately.

## 5. AI and the grounding rule

- **No number without a receipt.** The model may only state a number that exists in a stored Qloo response. Every evidence row stores its `qloo_cache_id` and the JSON path to the value; the database refuses a value that is not at that path (`evidence_requires_receipt`), and the validator in the concepts service drops such a claim before it is ever written.
- AI runs on the server only, through `lib/ai/client.ts`. `AI_MODELS.reasoning` for orchestration and concepts, `AI_MODELS.copy` for posts, captions and outreach.
- The pipeline has a fixed spine of six steps (scout, read neighbourhood, find gap, generate concepts, score, plan). Claude chooses tools inside a step, never the order of steps. Each step is its own server call, streamed, so no request approaches the host's time limit.
- Tools are typed, inputs and outputs are Zod-validated, prompts are versioned constants beside the service that uses them. Venue, guest and upstream content sent to a model is data, never instructions.
- The score is computed by the database (`concepts.total_score`): 40 x audience fit + 20 x novelty + 20 x venue fit + 20 x cost fit. The model proposes the four inputs with evidence; it never writes the total.
- In the interface the agent is "Loudnight" or "the planner". No AI jargon on screen.

## 6. Performance rules

- Server Components by default. Add `"use client"` only for interactivity, and keep client components small and leaf-level.
- Fetch in parallel on the server: `Promise.all([...])`. No request waterfalls. Pipeline sub-calls inside a step run in parallel where they are independent.
- Select only the columns you need. Never `select("*")` on wide or large tables in hot paths (`qloo_cache.response` is large: select it only when opening a receipt).
- Every list endpoint is paginated or capped.
- RLS performance: wrap `auth.uid()` and helper calls as `(select ...)` so they evaluate once. Index every column used in a policy or filter. Foreign keys get indexes.
- No N+1: join in the query or batch with `in()`.
- TanStack Query: sensible `staleTime`, invalidate precisely, never poll when Realtime or the stream can push.
- Realtime: subscribe with a filter (`event_night_id=eq.<id>`), always remove the channel on cleanup.
- Demo venues are precomputed so judges get results instantly. A fresh run targets about a minute.
- Images and fonts via `next/image` and `next/font`. Check `next build` output when adding a dependency.

## 7. Code quality rules

- **Comments:** none by default. One single-line `//` comment only where the reason is not obvious. Never multi-line or block comments, never JSDoc walls, never comments that restate code. SQL files may open with a short header saying what the migration does.
- Names say what things are. Functions do one thing. Prefer early returns to nesting.
- Files under 200 lines. Components under 150. Split before they grow.
- No `any`. No non-null `!` outside scripts. No `@ts-ignore`. No disabled lint rules without a one-line reason.
- No dead code, no commented-out code, no `console.log` (`console.error` only in `lib/http`).
- No duplicated strings for domain values: use `config/` constants, enums from `types/database.ts`.
- **UI copy:** plain, direct, human, written for a bar owner on a phone. No AI jargon, no hype, no "seamless", "powerful", "leverage", "unlock". Say what the thing does.
- **No long dashes** (em or en) anywhere: code, UI copy, docs, comments. Use a comma, colon, period or hyphen. `npm run check:dashes` enforces it.
- Formatting is Prettier (`npm run format`). Do not hand format.

## 8. UI and UX rules

The interface is warm, calm and evidence first. These rules are as binding as the layer rules.

**Design principles**

- Brand: by day copper `#A4361C` is the primary on warm white; at night (dark mode) the room goes dark and spotlight amber `#F2B860` becomes the primary on late-night ink. Spotlight is never body text on white. Colours come from tokens in `globals.css` only (`bg-primary`, `text-muted-foreground`, `bg-spotlight`), never raw hex in components. Every screen works in light and dark.
- Type: every size comes from `TYPE` in `lib/typography.ts`. Big Shoulders (`font-display`) is the marquee face, for the display line and page titles only; Geist for everything else. No all-caps labels, no `A · B` meta strings.
- The component gallery at `/dev/components` (development only) shows every shared component in every state. Add a new shared component to it, and check it there at four widths in both themes.
- Sharp, crisp shapes: the base radius is `0.25rem` (`--radius`). No pill buttons. Circles only for avatars, the loader and QR finder marks.
- Depth from tinted surfaces and spacing, not thick or coloured borders.
- One idea per card: a title, a one line description, then the content. Build cards with `SectionCard` and `KpiCard`.
- **Evidence is visible.** Every number shown from Qloo is an evidence chip that opens its receipt (the stored request and response). A number with no chip is a bug.
- Minimal icons: one 16px `lucide` icon per concept, always paired with text or an accessible name.
- Every screen answers three questions at a glance: what is the state, what needs me, what can I do next.
- Empty, loading and error states are designed. Use `EmptyState`, `Skeleton`, `BrandLoader`, `Spinner`.
- Motion is subtle and useful: entrances through `FadeIn`, the live trace through streamed steps. Nothing over 500ms. Custom animations include `motion-reduce:` handling. The global reduced-motion rule in `globals.css` must stay.

**Layout and responsiveness**

- Mobile first: owners and door staff use phones. Verify at 390, 768, 1280 and 1440 pixels, light and dark, before calling a screen done.
- No horizontal page scroll, ever. Grid and flex children that hold content get `min-w-0`. Long text wraps.
- Interactive targets at least 32px, primary actions 36px or more. The door check-in screen uses 48px targets.

**Patterns to reuse (search before building new ones)**

| Need                     | Use                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Cards and numbers        | `SectionCard`, `KpiCard`. Money through `formatMoney`, dates in the venue's time zone    |
| Status                   | `ToneBadge` (text, icon and colour), tones from `components/shared/tone.ts`              |
| Icon-only control        | `IconButton` (tooltip and `aria-label` together)                                         |
| Forms                    | `TextField`, `SubmitButton`, `showApiError`. One Zod schema shared with the API          |
| Streams (the live trace) | `apiStream` in `api.ts`, consumed by a hook. Never `fetch` in a component                |
| Page loading             | `loading.tsx` with `PageLoader`                                                          |
| Progress and measures    | `Stepper` for sequences and the trace, `MeterBar` for scores and break-even              |
| Details                  | `DetailSheet`: side sheet on desktop, bottom sheet on phones                             |
| One-tap actions          | `CopyButton`, `ShareButton`; the main action in a `StickyActionBar` on phones            |
| Failure                  | `ErrorState` with a retry; segment `error.tsx` files use it                              |
| Frames                   | `PublicShell` for public pages, `AppShell` for signed-in pages; never a page-made header |

Showing an action to someone who may use it is a courtesy. The server and the database still enforce it.

**Accessibility (WCAG 2.2 AA)**

- Text contrast at least 4.5:1, interface parts at least 3:1, in both themes. Links use the `text-link` token.
- Everything works from the keyboard with a visible focus style. Never remove focus outlines.
- Meaning never by colour alone: status has a label and an icon. The live trace announces steps through `aria-live`.
- Inputs have labels, errors sit next to their field, progress uses `role="meter"` or `role="status"` with values.
- Real landmarks and headings in order. One `h1` per page. A "Skip to content" link on every layout.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.

## 9. Database rules

- Schema changes are migrations in `supabase/migrations/` named `YYYYMMDDHHMMSS_description.sql`, applied in order, never edited after they are applied to the hosted project. Fix forward with a new file.
- After every migration: `supabase db reset` locally, `npm run db:test`, `supabase db lint`, then apply to the hosted project, run the security and performance advisors, run `supabase/tests/rls.sql` there, and regenerate `src/types/database.ts` (`npm run db:types`).
- Transactions: one business action that must succeed or fail together happens in one database transaction (trigger, function, or single statement).
- Integrity lives in the database: constraints, composite foreign keys, enums, checks, the receipt trigger. Application checks are for friendly messages, not safety.

## 10. Workflow

**Before writing code**

1. Read the relevant files and the active plan in `docs/architecture/plans/`.
2. Search for an existing implementation or pattern. Reuse it.
3. Decide what belongs in each layer (section 1) before typing. For UI, choose from the patterns in section 8.

**While writing**

- Inspect, then modify. Never rewrite a file you have not read.
- Smallest change that meets the plan. No speculative features. Respect the brief's cut-list order when behind.
- New feature = new folder in `modules/` following the layout above.

**After writing**

1. `npm run validate` must pass (dashes, typecheck, lint, format, tests, build).
2. Database changes: `npm run db:test` must pass.
3. Add or update tests for new logic (section 12).
4. Check the UI at 390, 768, 1280 and 1440px, light and dark, keyboard only, reduced motion.
5. Tick plan deliverables only when they are met and verified.

## 11. Commands

```bash
supabase start          # local Postgres, Auth, API and Realtime (Docker)
npm run dev             # dev server against .env.local
npm run validate        # dashes + typecheck + lint + format:check + test + build (run before every push)
npm run db:test         # every supabase/tests/*.sql against the local database
npm run db:types        # regenerate src/types/database.ts from the local schema
npm run check:connections  # proves Supabase, Qloo, Places, Ticketmaster and Anthropic answer with your keys
npm run check:dashes    # fails on em or en dashes
npm run typecheck       # next typegen + tsc --noEmit
npm run lint            # eslint
npm run format          # prettier --write
npm test                # vitest run
npm run test:coverage   # coverage for lib, modules, config
```

Single test file: `npx vitest run src/lib/http/route.test.ts`.

## 12. Testing

- Unit tests sit beside the code: `thing.ts` -> `thing.test.ts`. Test behaviour, not implementation.
- Must be tested: schemas, services, route wrapper behaviour, proxy gating, the grounding validator, scoring inputs, prompt builders, upstream clients' error handling, pure helpers.
- Mock at module boundaries (`vi.mock`), never the thing under test. Never call a real external API from a unit test. `server-only` is stubbed in `tests/stubs`.
- **Qloo fixtures are synthetic.** Hand-written objects that copy the shape of a real response and carry `"_synthetic": true`. Never save or commit a real Qloo response: Qloo's hackathon terms forbid their data in a public repository. Live probe output goes to `.probe/`, which git ignores.
- `beforeEach` callbacks must use braces so they do not return a mock (Vitest treats a returned function as cleanup).
- Database rules are tested in `supabase/tests/*.sql`. Success is `ERROR: ALL RLS ASSERTIONS PASSED`.
- Any bug fix starts with a failing test.

## 13. Definition of done

- [ ] Components contain no logic, no API calls, no Supabase
- [ ] Hooks own data and mutations; `api.ts` owns fetch; services own rules; repositories own queries; clients own transport
- [ ] Authorization: proxy, route roles, and RLS all cover the new surface, previews included
- [ ] Tenant safety: no client side scoping; new tables have composite keys, RLS, preview policies and tests
- [ ] Every Qloo number on screen has a receipt
- [ ] No duplicated logic, no file over 200 lines, no multi-line comments
- [ ] Inputs validated with Zod; errors do not leak internals or keys
- [ ] `npm run validate` and `npm run db:test` pass
- [ ] Responsive at 390, 768, 1280 and 1440px, light and dark, no console errors, no horizontal scroll
- [ ] Accessible: keyboard reachable, visible focus, labels, contrast, status not by colour alone, reduced motion respected
- [ ] Plan checkboxes updated only for verified deliverables
