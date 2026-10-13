# Encore

Fill your quiet nights. Encore is a programming director for bars, cafes, restaurants and small music venues. An owner enters their address and their slow night. Encore reads the neighbourhood's taste through [Qloo](https://www.qloo.com), finds what nobody nearby is running, invents a recurring event backed by evidence, finds the talent, produces the launch kit, and measures who actually came.

> Qloo knows what a neighbourhood loves. Encore turns that into people through the door on a Tuesday.

Live: https://encore-seven-dusky.vercel.app

Built for the Qloo hackathon (submissions close Oct 30, 2026). The full brief is in [`docs/reference/encore-system-brief.pdf`](docs/reference/encore-system-brief.pdf).

## Contents

1. [Status](#status)
2. [Tech stack](#tech-stack)
3. [Architecture in one minute](#architecture-in-one-minute)
4. [Getting started](#getting-started)
5. [Scripts](#scripts)
6. [Project layout](#project-layout)
7. [Roles](#roles)
8. [Contributing](#contributing)
9. [Documentation map](#documentation-map)

## Status

Phase 1 of 5 (Oct 12 to 14). See [`docs/architecture/plans/README.md`](docs/architecture/plans/README.md) for every plan, its gate and the schedule.

- [x] Foundation: stack, rules, brand, server layers, external clients, landing page (plan 00)
- [x] Full data model with RLS: venues and teams, the agent pipeline, receipts, series, RSVPs and check-ins, read-only previews, all tested
- [ ] Design system and app shell (plan 01); day-one Qloo probe across three neighbourhoods (plan 02, the phase 1 gate)
- [ ] Onboarding, fingerprint, gap scan, concepts, live trace, demo venues (plans 03 to 07, 09)
- [ ] Series and talent, launch kit, event pages, door check-in, dashboard, learning loop (plans 10 to 14)
- [ ] Administrator console with Preview as, installable door app, security, quality, deployment, submission, roadmap (plans 08, 15 to 20)

## Tech stack

Every version is pinned exactly in `package.json`. Do not use ranges.

| Technology                                                            | Version          | Used for                                                |
| --------------------------------------------------------------------- | ---------------- | ------------------------------------------------------- |
| [Next.js](https://nextjs.org)                                         | 16.3.6           | App Router, route handlers under `/api/v1`, `proxy.ts`  |
| [React](https://react.dev)                                            | 19.2.8           | User interface                                          |
| [TypeScript](https://www.typescriptlang.org)                          | 5.9.3            | Strict typing everywhere                                |
| [Tailwind CSS](https://tailwindcss.com)                               | 4.3.3            | Styling with design tokens for light and dark           |
| [shadcn/ui](https://ui.shadcn.com) on [Base UI](https://base-ui.com)  | 4.21.0 / 1.8.0   | Component source in `src/components/ui`                 |
| [Supabase JS](https://supabase.com/docs/reference/javascript) and SSR | 2.117.2 / 0.12.7 | Postgres, Auth (anonymous sessions), Realtime           |
| [Anthropic SDK](https://docs.anthropic.com)                           | 0.131.0          | Claude Sonnet 5.5 for planning, Haiku 5.5 for copy      |
| [Zod](https://zod.dev)                                                | 4.6.5            | One schema for forms, API bodies and upstream responses |
| [TanStack Query](https://tanstack.com/query)                          | 5.104.0          | Client data cache and mutations                         |
| [Vitest](https://vitest.dev)                                          | 5.0.2            | Unit tests                                              |

External services: Qloo Insights API, Google Places API (New), Ticketmaster Discovery API, Anthropic.

## Architecture in one minute

A layered modular monolith with shared-schema multi-tenancy. The tenant is the venue, and Postgres row level security enforces it.

```
component -> hook -> api.ts -> /api/v1 route -> service -> repository -> Supabase (RLS)
                                                   \-> lib/qloo, lib/places, lib/ticketmaster, lib/ai
```

- **The planner** runs six fixed steps: scout, read the neighbourhood, find the gap, generate concepts, score, plan. Claude picks the tools inside a step, never the order of the steps. Each step is its own streamed server call.
- **No number without a receipt.** Every Qloo answer is cached in `qloo_cache`. Every evidence chip stores the cached row and the JSON path of its value, and the database refuses a value that is not there.
- **Score** = 40 x audience fit + 20 x novelty + 20 x venue fit + 20 x cost fit, computed by the database.
- **Three gates**: `proxy.ts`, the route wrappers, RLS. A hidden button is never the control.
- **Preview as**: an administrator can see Encore as any owner or staff member, read only. The database enforces it.

Full reasoning: [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md).

## Getting started

Needs Node 22 or newer, Docker, and the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
npm install
supabase start                 # local Postgres, Auth, API, Realtime; applies migrations and seed
cp .env.example .env.local     # then fill in the values (see below)
npm run db:test                # PASS rls.sql
npm run dev                    # http://localhost:3000
```

For local development, `supabase start` prints the local URL, publishable key and secret key; put them in `.env.local`. For the hosted project, use its URL and keys instead. The Qloo, Google Places, Ticketmaster and Anthropic keys are needed only once the planner is built. `npm run check:connections` tells you which keys work, without printing them.

## Scripts

| Command                     | What it does                                                                  |
| --------------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`               | Development server                                                            |
| `npm run validate`          | Dashes, typecheck, lint, format check, tests and build. Run before every push |
| `npm run db:test`           | Every `supabase/tests/*.sql` against the local database                       |
| `npm run db:types`          | Regenerates `src/types/database.ts` from the local schema                     |
| `npm run check:connections` | Proves Supabase, Qloo, Places, Ticketmaster and Anthropic answer              |
| `npm test`                  | Unit tests                                                                    |
| `npm run format`            | Prettier                                                                      |

## Project layout

```
src/app            Routing only: pages, layouts, /api/v1 route handlers
src/components     ui (shadcn), layout, shared, forms, providers
src/config         Constants: site, roles, venues, journey, ai, integrations
src/lib            env, http, supabase, ai, qloo, places, ticketmaster, format
src/modules        One folder per business area: schemas, repository, service, api, hooks, components
supabase           migrations, seed.sql (demo venues), tests (RLS assertions), config.toml
docs               architecture (ARCHITECTURE.md, plans) and reference (the brief)
```

## Roles

| Role          | Who                        | Can                                                              |
| ------------- | -------------------------- | ---------------------------------------------------------------- |
| Administrator | Runs Encore                | Everything; previews anyone read only                            |
| Venue owner   | Whoever created the venue  | Everything at their venue, including the team and money settings |
| Venue manager | Invited by the owner       | Plans, series, nights, settings, spend                           |
| Door staff    | Invited by the owner       | Guest list and check-ins; never money                            |
| Guest         | Anyone with the event link | RSVP and check in; reads nothing back                            |

Judges and new owners need no account: demo venues are open to everyone, and starting a plan creates an anonymous session that can later be kept with an email.

## Contributing

1. Read [`CLAUDE.md`](CLAUDE.md). Every rule there is mandatory.
2. Pick the active plan in [`docs/architecture/plans`](docs/architecture/plans) and follow its Prompt section.
3. `npm run validate` and `npm run db:test` must pass before every push.
4. Tick plan boxes only for verified work.

## Documentation map

- [`CLAUDE.md`](CLAUDE.md): the rules
- [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md): the design and why
- [`docs/architecture/plans`](docs/architecture/plans): the schedule, gates, judging criteria, traceability and plans 00 to 20
- [`docs/reference`](docs/reference): the Encore system brief

## Licence

MIT. See [`LICENSE`](LICENSE).
