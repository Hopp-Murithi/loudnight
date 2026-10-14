# Plan 23: Shareable plan link

Status: Not started (plan written Oct 14)
Depends on: 07
Phase: 5 (stretch, from plan 20 part B)
Judging criteria: Design

## Goal

An owner or manager makes a link to one plan and sends it to a partner or co-owner. Whoever opens it sees that plan, read only, with its nights, scores and receipts, without an account. The link ends after seven days or the moment the owner ends it. It shows nothing else about the venue: no money, no team, no other plans.

## Brief coverage

Plan 20 part B item 1: "an owner shares a read-only link to their plan with a partner or co-owner (signed, expiring URL; RLS through a share token table)."

## Scope

In: `plan_shares` table and its rules, a "Share this plan" sheet on the plan page (make, copy, share, end), the public page `/shared/[token]`, receipts on that page.
Out: sharing the series, the ads or the door; editing through a link; view counts.

## Design

### Data

- `plan_shares`: `id`, `venue_id`, `run_id`, `token_hash` (SHA-256 hex of the token, unique), `created_by`, `expires_at`, `revoked_at`, `created_at`. Composite foreign key `(run_id, venue_id)` to `agent_runs` with its covering index, `venue_id` indexed, RLS on, the three preview policies, explicit grants.
- The token itself (32 random bytes, base64url) is made on the server, returned once, and never stored. A leaked database row cannot be turned back into a link.
- Policies: owners and managers read, create and end their venue's shares. Door staff and guests cannot.

### How a link reads a private plan without the service role

The page's Supabase client sends the token in a request header, `x-encore-share`, the same way Preview as sends its header. A `private.shared_run_ids()` function hashes that header and returns the run ids of shares that are neither expired nor ended. Extra select policies on `agent_runs`, `run_steps`, `concepts`, `evidence` and `venues` allow rows belonging to those runs. So the database, not the page, decides what a link can see, and a link can only ever read.

`venue_settings` gets no such policy: money is never shared.

### API

| Method and path                 | Access         | Notes                                              |
| ------------------------------- | -------------- | -------------------------------------------------- |
| `GET /api/v1/runs/[id]/shares`  | Owner, manager | Live links for the plan (never the token)          |
| `POST /api/v1/runs/[id]/shares` | Owner, manager | Makes a link, returns the token once, rate limited |
| `DELETE /api/v1/shares/[id]`    | Owner, manager | Ends a link                                        |

The existing public read routes (run, concepts, receipts) accept a `share` query value and build their client with the header, so receipts open on a shared page. The wrapper does this once for every public route.

## Screens

- **Share sheet** on the plan page: one button to make a link; the link with Copy and Share; "Ends in 7 days"; a list of live links with End. Bottom sheet on a phone.
- **`/shared/[token]`**: the venue name, "Shared plan, read only", the nights with their evidence, the taste and nearby tabs. An ended or unknown link shows one plain message and a link to Encore's home page.

## Tests

- `rls.sql`: a guest with a live token reads the run and its concepts; with no token, a wrong token, an expired or an ended one, reads nothing; never reads settings; door staff cannot create a share.
- Service: token hashing, expiry maths, the token is returned once and not stored.
- Route wrapper: the `share` value reaches the client header.

## Deliverables

- [ ] Owners and managers make, copy and end a link from the plan page
- [ ] The link opens the plan read only without an account, receipts included
- [ ] An expired or ended link shows nothing
- [ ] Money, team and other plans are never visible through a link (database tests)
- [ ] Screen standard met for the sheet and the shared page

## Verification

`npm run validate`, the rules test, then: make a link, open it in a private window, open a receipt, end the link, reload.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly, the new-table checklist in section 3 especially. Read this plan, the preview header mechanism in the row level security migration, `lib/supabase` and `lib/http/route.ts`. Order: migration and rule tests, service with tests, routes, the sheet, the shared page. No long dashes. Do not commit unless asked.
