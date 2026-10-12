# Plan 18: Deployment and environments

Status: Not started
Depends on: 00
Phase: 2 (first preview deploy) and 5 (production and the final deploy)
Judging criteria: all four depend on a working, publicly accessible app

## Goal

Encore is live on Vercel from phase 2 onward, so every later plan is checked on the real host, not just locally. Production runs against the hosted Supabase project with every key set as a sensitive variable, deploys only after the checks pass, and survives the whole judging period (Nov 2 to 16) without anyone touching it.

## Brief coverage

"Working, publicly accessible app (hosted on Vercel, no local-only demo)". "Encore is one Next.js app on Vercel backed by Supabase". Never cut: live hosting. Risk: "Long runs time out on Vercel": one call per step.

## Scope

In: Vercel project `encore` in the user's team, environment variables per environment, Supabase Auth URLs for each environment, route runtime and duration settings, preview deploys, production deploy procedure, rollback procedure, a custom domain if the user wants one, the judging-period watch plan, key and quota expiry dates.
Out: CI on GitHub Actions beyond what Vercel provides (optional enhancement in plan 20).

## Design

- Project: create with `vercel` CLI (logged in as `hopp-murithi`) after the user approves; framework Next.js; Node 22 or newer.
- Environments: Production uses the hosted project `hack2026`; Preview uses the same project (no paid branch) with the same RLS, so previews never get extra rights; Development uses the local stack.
- Variables (sensitive except `NEXT_PUBLIC_*`): everything in `.env.example`, plus `PREVIEW_COOKIE_SECRET` (plan 08). Never printed; set with `vercel env add`.
- Supabase Auth: site URL set to the production URL; redirect URLs for production, `https://*-<team>.vercel.app` previews, and localhost.
- Route settings: step and kit routes declare `export const maxDuration` within the plan's limit and run on the Node runtime; the run start route stays short. Each step's worst case measured and recorded here.
- Deploy procedure: `npm run validate`, `npm run db:test`, `npm run e2e`, migrations applied to hosted first (if any), then `vercel deploy --prod`, then the plan 17 smoke checklist. Rollback: `vercel rollback` to the previous deployment; migrations are additive, so the old code keeps working.
- Domain: optional custom domain (ask the user); otherwise `encore-<team>.vercel.app`.
- Judging-period watch: before Nov 2, confirm the Qloo key stays active through judging (it does, per the guide), check the monthly Qloo quota with the expected judge traffic (demo pages make no Qloo calls because they are precomputed), and the Anthropic, Places and Ticketmaster quotas and billing caps. Freeze deploys during judging except for fixes.

## Deliverables

- [ ] Vercel project created with the user's approval; repository connected if the user wants push-to-deploy
- [ ] Preview deploy live by the end of phase 2 against the hosted database
- [ ] All variables set per environment as sensitive; none printed or committed
- [ ] Supabase Auth URLs set for production, previews and localhost
- [ ] Step routes measured on Vercel and within their duration limit
- [ ] Production deploy follows the procedure; smoke checklist passes
- [ ] Rollback tried once on a preview
- [ ] Quotas and billing caps checked for the judging period; freeze date recorded

## Verification

`vercel env ls` (names only), a preview URL per phase, the smoke checklist on production, a timed fresh run on production.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read this plan and the Vercel and Next.js deployment guides in `node_modules/next/dist/docs/`.

Ask the user before creating the Vercel project, before setting any variable, before connecting the repository and before every production deploy. Never print secret values. Follow the deploy procedure exactly. Tick boxes only when verified. No long dashes. Do not commit unless asked.
