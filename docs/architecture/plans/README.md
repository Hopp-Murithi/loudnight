# Plans

How work happens: **one plan per feature, one plan at a time.** A plan is the single source of truth for what is being built, how to build it, and whether it is done. No page or feature is built without its plan.

## Rules

1. A checkbox is ticked **only when the deliverable is met and verified** (a test passes, or you saw it work). Not when the code is written.
2. Every plan has a **Prompt** section. To start work, tell Claude: `Read docs/architecture/plans/<file> and execute the Prompt section.` Nothing else is needed.
3. If reality changes the plan, edit the plan first, then the code.
4. When every box is ticked, set the status to `Done` here and in the plan.
5. A phase does not end until its gate passes. If behind, cut in the brief's order (below), never the "never cut" list.
6. Every plan that adds a screen meets the **Screen standard** below. Every plan that adds logic meets the **Test standard**. These are deliverables of every plan even when the plan does not repeat them.

## Schedule: five gated phases, Oct 12 to Oct 29

Submissions close Oct 30, 11:45 pm EDT (Oct 31, 6:45 am Nairobi). Target Oct 29; Oct 30 is buffer. Judging Nov 2 to 16, winners Nov 23.

| Phase | Dates     | Plans                      | Gate (must pass to move on)                                                                            |
| ----- | --------- | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1     | Oct 12-14 | 00, 01, 02                 | `npm run validate` green; app shell and design system in place; Qloo probe passes for 2 of 3 areas     |
| 2     | Oct 15-18 | 03, 04, 05, 18 (preview)   | An owner onboards in two minutes; fingerprint and gap scan stored with receipts; first Vercel preview  |
| 3     | Oct 19-22 | 06, 07, 09                 | A fresh run streams six steps to three scored concepts in about a minute; generic toggle; demo instant |
| 4     | Oct 23-26 | 10, 11, 12, 13, 14         | Core complete: series, talent, launch kit, event page, RSVP, QR check-in, dashboard, learning on phone |
| 5     | Oct 27-29 | 08, 15, 16, 17, 18, 19, 20 | Live on Vercel, logged-out judge path on desktop and phone, audits passed, submission filed            |

If the day-one Qloo probe fails (thin location data), switch neighbourhoods or lean on interest signals before writing pipeline code (plan 02 records the decision).

**Cut-list if behind, in this order:** 1. learning loop automation (keep check-in counts), 2. partner cross-promo, 3. talent outreach drafts (keep the shortlist), 4. poster generation (keep the posts).
**Never cut:** the Generic vs Encore toggle, evidence chips with receipts, the live trace, preloaded demo venues, live hosting.

## Index

| #   | Plan                                                                              | Phase | Status            | Depends on |
| --- | --------------------------------------------------------------------------------- | ----- | ----------------- | ---------- |
| 00  | [Setup and configuration](00-setup-and-configuration.md)                          | 1     | Done              | none       |
| 01  | [Design system, app shell and screen map](01-design-system-and-app-shell.md)      | 1     | Done              | 00         |
| 02  | [Qloo probe and integration correctness](02-qloo-probe-and-integration.md)        | 1     | Done              | 00         |
| 03  | [Accounts, venue onboarding and team](03-sessions-onboarding-and-team.md)         | 2     | Done              | 01         |
| 04  | [Neighbourhood taste fingerprint](04-taste-fingerprint.md)                        | 2     | Done              | 02         |
| 05  | [Competitor gap scan](05-competitor-gap-scan.md)                                  | 2     | Done              | 03, 04     |
| 06  | [Concepts, scoring and grounding](06-concepts-scoring-grounding.md)               | 3     | Done              | 04, 05     |
| 07  | [Pipeline runs, live trace and generic toggle](07-runs-live-trace-generic.md)     | 3     | Built, live       | 06         |
| 08  | [Administrator console and Preview as](08-admin-console-and-preview.md)           | 5     | Not started       | 03, 13     |
| 09  | [Demo venues and the judge path](09-demo-venues-judge-path.md)                    | 3     | First pass live   | 07         |
| 10  | [Series planner and talent finder](10-series-and-talent.md)                       | 4     | Built, live       | 06         |
| 11  | [Launch kit and distribution](11-launch-kit-and-distribution.md)                  | 4     | In progress       | 10         |
| 12  | [Event pages, RSVP and QR](12-event-pages-rsvp-qr.md)                             | 4     | Not started       | 11         |
| 13  | [Door check-in, live dashboard and measurement](13-door-dashboard-measurement.md) | 4     | Not started       | 12         |
| 14  | [Learning loop](14-learning-loop.md)                                              | 4     | Not started       | 13         |
| 15  | [Installable app for door staff](15-installable-app.md)                           | 5     | Not started       | 13         |
| 16  | [Security hardening and Qloo data compliance](16-security-and-compliance.md)      | 5     | Not started       | 12, 13     |
| 17  | [Quality: end-to-end, accessibility, performance, observability](17-quality.md)   | 5     | Not started       | 09, 13     |
| 18  | [Deployment and environments](18-deployment.md)                                   | 2, 5  | Live, in progress | 00         |
| 19  | [Submission: write-up, screenshots, video, pilot](19-submission.md)               | 5     | Not started       | all core   |
| 20  | [Roadmap write-ups and stretch enhancements](20-roadmap-and-enhancements.md)      | 5     | Not started       | 19         |
| 21  | [Landing page and product film](21-landing-page-and-film.md)                      | 2     | In progress       | 01, 03     |

## Official judging criteria and how the plans answer them

From the hackathon page (these replace the five criteria in the brief, which predates them). Every plan names the criteria it serves; plan 19 turns them into the write-up and the video.

| Criterion                                                                                                                | What the judges look for                 | Where Encore earns it                                                                                                                                                                          | Plans                  |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **Technological Implementation**: how thoroughly and skilfully the project uses Qloo; genuine, working, non-trivial code | Depth of Qloo use; a real working system | Six Qloo surfaces (location insights, demographics, cross-domain affinity, entity search, tags, popularity) drive decisions; cache and receipts; grounding trigger; streamed agent; RLS; tests | 02, 04, 06, 07, 16, 17 |
| **Design**: a complete, coherent product experience, not a proof of concept                                              | End-to-end flow that feels finished      | Two-minute onboarding to launched night to measured turnout, every state designed, mobile first, light and dark, one design system                                                             | 01, 03, 09-15, 17      |
| **Potential Impact**: a credible, specific case for a real problem and audience, addressed by what is demonstrated       | Real venues, real money, real attendance | Break-even input drives the maths; check-ins prove turnout; pilot venue result; unit economics on screen                                                                                       | 13, 14, 19             |
| **Quality of the Idea**: creative, non-obvious use of Qloo; genuine understanding of the problem space                   | Not another consumer recommender         | Supply-side taste AI (helps the venue, not the consumer); cross-domain concepts; Generic vs Encore toggle shows why Qloo matters; closes decide, execute, promote, measure                     | 06, 07, 09, 19         |

Proof points each criterion needs on screen during judging: the "Powered by Qloo" panel and evidence receipts (Technological Implementation), the logged-out judge path on a phone (Design), the dashboard and break-even calculator with pilot numbers (Potential Impact), the Generic vs Encore toggle (Quality of the Idea).

## Screen standard (applies to every screen in every plan)

**Breakpoints.** Design mobile first and verify at four widths:

| Width  | Device class                      | Layout rule                                                                               |
| ------ | --------------------------------- | ----------------------------------------------------------------------------------------- |
| 390px  | Phone (owner, door staff, guests) | One column; sticky primary action at the bottom where a screen has one; drawer navigation |
| 768px  | Tablet (often the door)           | Two columns where content pairs naturally; cards in a 2-up grid; drawer or icon rail      |
| 1280px | Laptop (owner planning)           | Sidebar expanded; content max width 1200px; 3-up grids; side sheets for details           |
| 1440px | Desktop (judges)                  | Same as 1280 with more breathing room; never stretch text lines past about 80 characters  |

**Every screen must have:**

- One `h1`, landmarks (`header`, `nav`, `main`), a skip link, headings in order.
- Designed states: loading (`Skeleton` or `PageLoader`), empty (`EmptyState` with a next action), error (plain sentence plus a retry), and partial (some data failed: show what loaded, flag what did not).
- No horizontal scroll at any width; `min-w-0` on flex and grid children; long names wrap or truncate with a tooltip.
- Light and dark checked; contrast 4.5:1 for text and 3:1 for interface parts; status never by colour alone.
- Keyboard: every action reachable, visible focus, Escape closes sheets and dialogs, focus returns to the trigger.
- Touch targets 32px minimum, primary actions 36px, door screens 48px.
- `prefers-reduced-motion` respected; no animation over 500ms.
- Copy reviewed against `CLAUDE.md` section 7 (plain, no jargon, no long dashes).
- Checked with `?slow=1` or devtools throttling ("Slow 4G") so loading states are seen, not assumed.

## Test standard (applies to every plan that adds logic)

- Unit tests beside the code for schemas, pure helpers, services (with repositories and clients mocked), and route handlers' behaviour through the wrappers.
- Database changes: new assertions in `supabase/tests/rls.sql` (or a new `supabase/tests/<area>.sql`), passing locally (`npm run db:test`) and on the hosted project.
- External APIs never called from tests. Fixtures are **synthetic**: hand-written objects that copy the shape of a real response, never a saved real Qloo response (Qloo's terms forbid putting their data in a public repository).
- From plan 17 on, the judge path and the guest path have Playwright end-to-end tests; any plan that changes those paths updates them.
- `npm run validate` and `npm run db:test` pass before a box is ticked.

## Traceability: every part of the brief and where it ships

| Brief item                                                                                                                    | Plan(s)                |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Venue onboarding: address autocomplete, slow night, break-even, capabilities, budget, Places fill-in                          | 03                     |
| Neighbourhood taste profile across 8+ domains, demographic skew, "taste fingerprint"                                          | 02, 04                 |
| Competitor gap scan: nearby venues (Places), nearby events (Ticketmaster) on that night                                       | 05                     |
| Concept generator: 6 candidates from cross-domain affinity overlaps, re-checked with Qloo, top 3 kept                         | 06                     |
| Concept score formula (40/20/20/20) and its four inputs                                                                       | 06                     |
| Evidence chips; grounding rule; validator; "no number without a receipt"                                                      | 06, 16                 |
| Live agent trace streaming each step and finding with its source                                                              | 07                     |
| Fixed six-step spine; Claude picks tools inside a step; one server call per step                                              | 07                     |
| Generic AI vs Encore toggle                                                                                                   | 07, 09                 |
| "Powered by Qloo" panel listing every call in a run                                                                           | 07                     |
| Preloaded demo venues: 3 real US neighbourhoods, instant, no signup                                                           | 09                     |
| 4-week series calendar with weekly variations                                                                                 | 10                     |
| Talent finder: audience overlap, right popularity tier, outreach drafts                                                       | 10                     |
| Launch kit: poster (Satori), posts for Instagram, Facebook, TikTok, Google Business Profile, menu specials, event description | 11                     |
| Ad targeting brief: Qloo affinities as Meta/TikTok interests, radius, age band, daily budget                                  | 11                     |
| Performer promo kit, partner cross-promo, regulars SMS/email text                                                             | 11                     |
| Event page with RSVP, add-to-calendar, share links, QR code                                                                   | 12                     |
| Door check-in by QR, owner logs spend                                                                                         | 13                     |
| Dashboard: RSVPs, check-ins, show-up rate, distance to break-even                                                             | 13                     |
| Break-even calculator and the unit logic for the pitch                                                                        | 13, 19                 |
| Learning loop: keep, tweak or swap the next date                                                                              | 14                     |
| Models: Sonnet 5.5 for orchestration, Haiku 5.5 for bulk copy                                                                 | 06, 07, 11             |
| Abuse and cost control: per-IP limits on fresh runs, Qloo cache reuse                                                         | 07, 16                 |
| Open source, MIT, keys only in env                                                                                            | 00, 16, 19             |
| Live, publicly accessible app on Vercel                                                                                       | 18                     |
| Mobile-first, two-minute onboarding, one-tap launch kit                                                                       | 01, 03, 11             |
| Demo script (two minutes) and the hook "trivia night"                                                                         | 09, 19                 |
| Submission checklist: live URL, demo venues, repo, README, Devpost write-up, screenshots, video, pilot result                 | 19                     |
| Confirm eligibility for Kenya, prize payment, start date, Qloo key access                                                     | 02, 19                 |
| Roadmap: auto-posting, POS integration, talent marketplace, multi-venue dashboard, brand sponsorship (written up, not built)  | 20                     |
| Risks: thin Qloo data, rate limits, famous talent, hallucinated numbers, Vercel timeouts, scope creep, no pilot               | 02, 06, 07, 10, 16, 19 |
| Carried over from UNoN: Preview as, audit log page, roles, installable app                                                    | 08, 15                 |

## Template for a new plan

```markdown
# Plan NN: Title

Status: Not started | In progress | Done
Depends on: plan numbers
Phase: N

## Goal

One paragraph. What is true when this is finished.

## Brief coverage

Which lines of the brief this plan delivers.

## Scope

In: ...
Out: ...

## Design

Modules and files, routes and pages, API endpoints (method, path, access, body), data and migrations, prompts.

## Screens

For each screen: purpose, layout at 390 / 768 / 1280 / 1440, states, accessibility notes.

## Tests

Unit, database and end-to-end tests this plan adds.

## Deliverables

- [ ] Each item is checkable by a person or a test

## Verification

Commands and manual checks that prove the deliverables.

## Prompt

A self-contained instruction for Claude. It names the files to read, the order of work, the constraints, and the checks to run.
```
