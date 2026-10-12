# Plan 16: Security hardening and Qloo data compliance

Status: Not started
Depends on: 12, 13
Phase: 5 (the rate limiter itself is built early, in phase 2, because plans 03, 07, 12 and 13 call it)
Judging criteria: Technological Implementation (a working, trustworthy system), the brief's "trust and governance" judge

## Goal

Encore is safe to leave open to the public through judging: every public and costly endpoint is rate limited, Qloo data is handled within the hackathon's terms, the API surface leaks nothing, dependencies are clean, and a security review of the whole codebase finds nothing open.

## Brief coverage

"Abuse and cost control: per-IP rate limits on fresh runs; Qloo responses reused from cache." "Open source: MIT licence; API keys only in environment variables." Risk "Qloo rate limits": cache every response. Hackathon guide: "Do not store Qloo response data in a public repository."

## Scope

In: the rate limiter (store, function, helper, tests), limits on every public and run-starting endpoint, Qloo data minimisation (narrow `qloo_cache` reads to server-built slices), a repository scan for Qloo data, secret scanning, `npm audit`, header and CSP review, Supabase Auth settings check, error leakage review, a full security review.
Out: penetration testing by a third party.

## Design

### Rate limiter (built in phase 2)

- Migration: table `private.rate_limit_hits (bucket text, hit_at timestamptz)` with an index on `(bucket, hit_at)` and no grants to anon or authenticated. Function `private.consume_rate_limit(bucket, max_hits, window_seconds) returns boolean` (`security definer`, `search_path = ''`) counts hits in the window, records one if under the limit, and deletes that bucket's expired rows. A thin `public.consume_rate_limit` wrapper (`security invoker`) is granted to `service_role` only, so PostgREST can call it from the server and no session can.
- `lib/http/rate-limit.ts`: `RateLimiter` interface, a database implementation using the service role (allowed use, added to `CLAUDE.md`), and a fake for tests. The bucket is `route:sha256(ip + daily salt)`; the raw IP is never stored.
- Client IP from `x-forwarded-for` on Vercel (first value), falling back to `x-real-ip`; tested.
- Limits (in `config/limits.ts`): session start 10 per hour per IP; run start 6 per hour per IP (plus the database's per-person cap); RSVP 10 per 10 minutes per IP and 300 per night; self check-in 20 per 10 minutes per IP; Places search 60 per 10 minutes per session; poster render 120 per hour per IP.

### Qloo data compliance

- Migration: revoke `select` on `qloo_cache` from `anon` and `authenticated`; drop `qloo_cache_select`. Receipts are served only by the receipt route (plan 06), which checks the evidence is readable through the caller's client, then returns the slice. Assert in `rls.sql` that sessions cannot read `qloo_cache` directly.
- `run_steps.input` and `output_summary` hold summaries, never whole Qloo responses (checked in the step writer, tested).
- Repository scan: `scripts/check-no-qloo-data.mjs`, run in `validate`, fails if any tracked file contains a Qloo response shape (an object with both an entity id field and an affinity field, using the field names from plan 02's findings) unless that object carries `"_synthetic": true`, or if any tracked path is under `.probe/`. Every hand-written fixture carries the marker.
- README "Qloo usage" section states how data is cached (private, server side) and that none is in the repository.

### Review and hygiene

- `npm audit --omit=dev`: no high or critical; others recorded here with a reason.
- Secret scan of the git history with `gitleaks` (or `git log -p | grep` for key prefixes) before the repository goes public.
- Headers: confirm CSP in production allows exactly Supabase, Google image hosts and our own origin; `connect-src` includes the Supabase Realtime socket; no `unsafe-eval` in production. Add `Cross-Origin-Opener-Policy: same-origin`.
- Errors: grep every route for messages passed through from upstreams or the database; all use the mapped errors.
- Supabase: advisors clean; Auth settings match `ARCHITECTURE.md` section 10; anonymous sign-in rate limit set; leaked password protection on if available.
- Run the `security-review` skill over the whole repository and fix every finding.

## Tests

- Limiter: allows up to the limit, refuses after, resets after the window, buckets are separate, raw IP never stored.
- IP extraction cases.
- Each limited route returns 429 with a plain message (route tests with the fake).
- `rls.sql`: `qloo_cache` unreadable by anon and authenticated; receipt route still works.
- `check-no-qloo-data` catches a planted fixture in a temp file.

## Deliverables

- [ ] Rate limiter built in phase 2 and used by every route in the limits table
- [ ] `qloo_cache` no longer readable by sessions; receipts still open through the route
- [ ] No Qloo response data in the repository (scan passes in `validate`)
- [ ] `npm audit` clean or every finding recorded with a reason
- [ ] Git history scanned for secrets before the repository is public
- [ ] Production headers and CSP verified on the deployed site
- [ ] Security review run and every finding fixed or recorded
- [ ] Advisors clean on the hosted project

## Verification

`npm run validate`, `npm run db:test`, hammer the RSVP endpoint with 20 quick requests and see 429s, `curl -I` the production site for headers, run the security review.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read this plan, `CLAUDE.md` sections 3 and 4, plan 06's receipt route, and the Qloo hackathon guide's caching rule quoted in plan 02.

Build the limiter first (it is needed in phase 2), with its migration, assertions and tests, and add its allowed service-role use to `CLAUDE.md`. In phase 5, do the compliance migration, the scan script, the audits and the review. Ask the user before scanning or rewriting git history. Run `npm run validate` and `npm run db:test`. Tick boxes only when verified. No long dashes. Do not commit unless asked.
