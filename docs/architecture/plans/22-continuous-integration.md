# Plan 22: Continuous integration

Status: Done (Oct 14). First green run: 38515016615, both jobs.
Depends on: 00
Phase: 5 (stretch, from plan 20 part B)

## Goal

Every push and pull request runs the same checks a person runs before pushing: `npm run validate`, and the database rule tests against a real local Supabase stack. A red check means the change is not safe to deploy.

## Brief coverage

Plan 20 part B item 6: "GitHub Actions CI: run validate and db:test on every push with a Supabase local stack."

## Scope

In: one workflow file with two jobs, a note in the README.
Out: deploy from CI (Vercel deploys on its own), end-to-end browser tests (plan 17).

## Design

- `.github/workflows/ci.yml`, triggered on `push` and `pull_request`.
- Job `validate`: Node 22, `npm ci`, `npm run validate`. The build needs the public environment variables to exist, so the job sets placeholder values for them. No secret is needed and none is set: unit tests never call a real service.
- Job `database`: `supabase/setup-cli`, `supabase db start` (Postgres only, which is all the rule tests need), then `npm run db:test`. Migrations are applied by the start command, so a migration that does not apply cleanly fails here too.
- Least privilege: `permissions: contents: read`. Actions are pinned to a major version. Concurrency cancels an older run on the same branch.

## Screens

None.

## Tests

The workflow is its own test: it must go green on the current tree.

## Deliverables

- [x] Workflow file runs `validate` and the database tests on push and pull request
- [x] Both jobs are green on GitHub for the current tree (run 38515016615; the first run failed on a lock file missing two Linux-only optional packages, fixed in b0f12be)
- [x] No secret is required by the workflow (placeholders only; checked Oct 14)

## Verification

Push the branch, open the Actions tab, confirm both jobs pass.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read this plan, `package.json` scripts, `scripts/run-db-tests.mjs` and `src/lib/env`. Write the workflow, then ask the user to push so it can be seen running. Tick boxes only when the run is green. No long dashes. Do not commit unless asked.
