# Plan 01: Design system, app shell and screen map

Status: Done. The sidebar focus finding was fixed in plan 03 (solid inset outline); the user reviews the UI by hand.
Depends on: 00
Phase: 1
Judging criteria: Design (a complete, coherent product, not a proof of concept)

## Goal

Before any feature page exists, Loudnight has one design system and one shell that every later plan builds into: tokens, type scale, spacing, motion, the shared components, the signed-in shell with venue switching and role-aware navigation, the public page frame, and a written map of every route in the product with its owner plan, its audience and its layout at each breakpoint. A dev-only component gallery lets anyone check every component in light and dark at every width.

## Brief coverage

"Mobile-first", "two-minute onboarding", "one-tap launch kit", "the owner never faces a blank page: every step ends in something they can approve, edit or send". The shell and patterns here are what make the later screens coherent.

## Scope

In: design tokens and type scale, the component inventory below, `AppShell` (sidebar, drawer, top bar, venue switcher slot, account menu, theme toggle), `PublicShell` (landing, demo, event and door pages), role-aware navigation config, the route map, `ErrorState`, `CopyButton`, `ShareButton`, `StickyActionBar`, `DetailSheet`, `Stepper`, `MeterBar`, the dev-only gallery at `/dev/components`, copy voice guide.
Out: feature content. Pages listed in the route map are built by their owner plans; this plan only creates the frames and placeholder `loading.tsx`, `error.tsx` and `not-found.tsx` per segment.

## Design

### Tokens and type

- Colour tokens stay in `src/app/globals.css` (done in plan 00). Add semantic aliases only if a component needs one, never raw hex.
- Type scale (Tailwind classes, documented in the gallery): display `text-4xl sm:text-5xl font-semibold tracking-tight`, h1 `text-2xl sm:text-3xl font-semibold`, h2 `text-xl font-semibold`, h3 `text-base font-semibold`, body `text-sm sm:text-base`, caption `text-xs text-muted-foreground`. Numbers use `tabular-nums`.
- Spacing rhythm: page gutters `px-4 sm:px-6`, section gap `space-y-8 sm:space-y-12`, card padding from `Card`.
- Motion: entrances through `FadeIn` (60ms stagger), sheet and dialog transitions from Base UI, spinner and the brand loader. All honour `motion-reduce:`.
- Radius `0.25rem`; circles only for avatars, the loader and QR finder marks.

### Components (in `src/components`)

| Component                                                                                             | Purpose                                                                                 | Notes                                                      |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `AppShell`                                                                                            | Signed-in frame: sidebar (desktop), drawer (phone), top bar with page title and actions | Sidebar state in a cookie, as UNoN                         |
| `PublicShell`                                                                                         | Header with brand and theme toggle, footer with licence and "Taste data from Qloo"      | Used by landing, demo, event and door pages                |
| `VenueSwitcher`                                                                                       | Shows the current venue and lets a member switch; slot filled by plan 03                | Keyboard and screen reader friendly listbox                |
| `AccountMenu`                                                                                         | Display name, "Add your email" for anonymous sessions, theme, sign out                  | Items appear only when allowed                             |
| `PageHeader`                                                                                          | Title, one line description, actions (exists)                                           |                                                            |
| `SectionCard`, `KpiCard`, `ToneBadge`, `EmptyState`, `IconButton`, `FadeIn`, `Spinner`, `BrandLoader` | Exist from plan 00                                                                      | Reviewed for dark mode and 390px                           |
| `ErrorState`                                                                                          | Plain sentence, what still works, a retry button                                        | `role="alert"`                                             |
| `DetailSheet`                                                                                         | Side sheet on desktop, full-height bottom sheet on phones                               | Evidence receipts, talent, night details                   |
| `Stepper`                                                                                             | Vertical list of steps with status icon, label, finding and timing                      | The live trace (plan 07) and onboarding progress (plan 03) |
| `MeterBar`                                                                                            | `role="meter"` bar with label and value, optional target marker                         | Break-even distance, scores                                |
| `CopyButton`                                                                                          | Copies text, announces "Copied" through `aria-live`, falls back gracefully              | Launch kit                                                 |
| `ShareButton`                                                                                         | Web Share API on phones, copy link elsewhere                                            | Event pages, launch kit                                    |
| `StickyActionBar`                                                                                     | Primary action pinned to the bottom on phones, inline on desktop                        | Onboarding, concept choice, launch                         |
| `Skeleton` layouts                                                                                    | `CardSkeleton`, `ListSkeleton`, `TraceSkeleton`                                         | Shape matches the real content                             |

### Navigation (`src/config/navigation.ts`)

Driven by the viewer's venue role; never hard-coded per page.

| Item     | Route                   | Owner | Manager | Door |
| -------- | ----------------------- | ----- | ------- | ---- |
| Overview | `/venues/[id]`          | yes   | yes     | no   |
| Plan     | `/venues/[id]/plan`     | yes   | yes     | view |
| Series   | `/venues/[id]/series`   | yes   | yes     | view |
| Door     | `/venues/[id]/door`     | yes   | yes     | yes  |
| Results  | `/venues/[id]/results`  | yes   | yes     | no   |
| Team     | `/venues/[id]/team`     | yes   | view    | no   |
| Settings | `/venues/[id]/settings` | yes   | yes     | no   |
| History  | `/venues/[id]/history`  | yes   | yes     | no   |

Administrators additionally see "Admin" (`/admin`, plan 08). Navigation is a courtesy; the server and RLS still enforce every rule.

### Route map (every page in the product)

| Route                           | Audience         | Owner plan | Layout at 390 / 768 / 1280+                                                                 |
| ------------------------------- | ---------------- | ---------- | ------------------------------------------------------------------------------------------- |
| `/`                             | Everyone         | 00, 09     | Hero, journey steps (1 / 2 / 3 columns), demo venues (1 / 2 / 3), call to action            |
| `/start`                        | Visitors         | 03         | Single centred card at every width                                                          |
| `/auth/confirm`                 | Email upgrade    | 03         | Single centred card, button POST (never consume a token on GET)                             |
| `/demo/[venueId]`               | Everyone, judges | 09         | Venue header, Generic vs Loudnight toggle, trace replay, concept cards (1 / 1 / 3)          |
| `/venues`                       | Signed in        | 03         | Venue cards (1 / 2 / 3), "Add a venue"                                                      |
| `/venues/new`                   | Signed in        | 03         | Stepped form, sticky action on phones, two-column review at 1280                            |
| `/venues/[id]`                  | Owner, manager   | 03, 13     | Next night card, KPIs (1 / 2 / 4), plan status, quick actions                               |
| `/venues/[id]/plan`             | Team             | 06, 07     | Trace (top on phone, left column at 1280), concepts (stacked / 2-up / 3-up), generic toggle |
| `/venues/[id]/plan/[runId]`     | Team             | 07         | Same as above for a past run                                                                |
| `/venues/[id]/series`           | Team             | 10         | Calendar (list on phone, 4 columns at 1280), talent shortlist                               |
| `/venues/[id]/nights/[nightId]` | Team             | 11, 13, 14 | Tabs: Launch kit, Guests, Results; launch kit cards (1 / 2 / 3)                             |
| `/venues/[id]/door`             | Team             | 13         | Full-bleed door screen, 48px targets, scanner and search, live count                        |
| `/venues/[id]/results`          | Owner, manager   | 13, 14     | KPIs, per-night table (cards on phone), break-even calculator                               |
| `/venues/[id]/team`             | Owner (edit)     | 03         | Member list (cards on phone, table at 1280), invite form                                    |
| `/venues/[id]/settings`         | Owner, manager   | 03         | Same form as onboarding, grouped in cards                                                   |
| `/venues/[id]/history`          | Owner, manager   | 08         | Audit list for the venue, paginated                                                         |
| `/account`                      | Signed in        | 03         | Display name, add email, sign out                                                           |
| `/e/[slug]`                     | Guests           | 12         | Poster, details, RSVP form, add to calendar, share; single column, max 640px                |
| `/e/[slug]/ticket/[code]`       | Guests           | 12         | QR ticket full width, brightness tip, add to wallet-style save                              |
| `/e/[slug]/here`                | Guests at door   | 13         | One big "I'm here" button with party size                                                   |
| `/admin` and children           | Administrators   | 08         | Overview KPIs, tables with detail sheets                                                    |
| `/dev/components`               | Development only | 01         | Gallery of every component, theme and width switches; `notFound()` in production            |

### Copy voice

Short sentences, second person, venue words ("night", "regulars", "door", "break-even"), never AI words. Every button says what happens ("Plan my Tuesday", "Copy post", "Check in"). Errors say what failed and what to do. Numbers always carry their unit and, for Qloo numbers, their receipt.

## Screens

- **Shell at 390px:** top bar with menu button, page title, one action; drawer with venue switcher, nav, account. At 768px: icon rail with tooltips. At 1280px and up: expanded sidebar, collapsible.
- **Public frame:** brand left, theme right, max width 1200px, footer with licence and Qloo credit.
- **Gallery:** every component in default, hover, focus, disabled, loading, empty and error variants; buttons to switch theme and preview at 390, 768, 1280 and 1440 widths inside an iframe.

## Tests

- Navigation config: each venue role gets exactly the items in the table (unit).
- `CopyButton` announces success and handles a refused clipboard (React Testing Library).
- `StickyActionBar` renders inline above 768px and sticky below (class assertions).
- Gallery route returns 404 when `NODE_ENV=production` (unit on the page guard).

## Deliverables

- [x] Type scale, spacing and motion rules documented in the gallery (`TYPE` in `lib/typography.ts`; Big Shoulders as the marquee face)
- [x] Every component in the table built or reviewed, with all states in the gallery
- [x] `AppShell` and `PublicShell` used by a placeholder page for each route group; checked in headless Chrome at all four widths, light and dark, no overflow, no console errors
- [x] Role-aware navigation config with tests; door staff never see Overview, Results, Team or Settings
- [x] Segment `loading.tsx`, `error.tsx` and `not-found.tsx` for `(public)`, `(app)` and `admin`
- [x] Route map above checked against the brief; no changes needed
- [x] Gallery reachable in development only (production build returns 404 for `/dev/components` and `/dev/components/shell`)
- [x] Screen standard met for the shell and gallery. The one finding (no visible focus ring in the dark sidebar) was fixed in plan 03 with a solid inset outline on every focusable element in the sidebar

## Verification

`npm run validate`. Open `/dev/components` at 390, 768, 1280 and 1440 in light and dark, tab through every component, turn on reduced motion. Build for production and confirm `/dev/components` is a 404.

## Prompt

---

You are working on Loudnight. Follow `CLAUDE.md` exactly, section 8 above all. Read `CLAUDE.md`, `ARCHITECTURE.md`, the plans README (Screen standard), this plan, and the existing `src/components`. Load the `frontend-design` skill before designing the shell. Read the Next.js guide in `node_modules/next/dist/docs/` for route groups, layouts and `notFound`.

Order: tokens and type in the gallery first, then the missing components with their states, then the shells, then navigation config and tests, then placeholder segment files. Reuse the shadcn primitives in `src/components/ui` (Base UI uses `render`, not `asChild`). Do not build feature content. Run `npm run validate`. Check every width and theme in a browser. Tick boxes only when verified. No long dashes. Do not commit unless asked.
