# Plan 20: Roadmap write-ups and stretch enhancements

Status: Not started
Depends on: 19 (only after the submission checklist is met)
Phase: 5, and only with time left after plan 19
Judging criteria: Potential Impact (a credible path from one bar to enterprise), Quality of the Idea

## Goal

The roadmap the brief promises is written up clearly enough that a judge believes it, without being built. A short, ranked list of stretch enhancements is ready to pick up only if the core is done, tested and submitted, in the order that most improves the score.

## Brief coverage

Feature table, roadmap tier: "Auto-posting to Meta / Google", "POS integration (Toast, Square)", "Talent marketplace + payments", "Multi-venue dashboard", "Brand sponsorship matching". Business model stages 1 to 5. Moat: outcome data, network effects, switching cost. Go-to-market: venue clusters in a few US cities, performer collectives, POS and hospitality software integrations, Kenya and other markets once Qloo's location coverage is confirmed.

## Part A: roadmap write-ups (documents only, in `docs/roadmap.md`)

For each item: the problem it solves, how it builds on what exists (tables, modules), what it needs (app review, partner APIs, payments licence), the first slice, and the risk.

| Item                            | Builds on                                              | Needs                                            |
| ------------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Auto-posting to Meta and Google | Launch kit assets (plan 11), `event_nights.assets`     | Meta and Google app review, OAuth per venue      |
| POS integration                 | `checkins.spend_cents`, `night_spend` (plan 13)        | Toast and Square partner APIs, per-venue OAuth   |
| Talent marketplace and payments | `talent_candidates` (plan 10), outreach drafts         | Payments provider, contracts, performer accounts |
| Multi-venue dashboard           | `venue_members` roles, administrator console (plan 08) | Group entity above venues, group roles           |
| Brand sponsorship matching      | Partner cross-promo (plan 11), outcome data (plan 14)  | Brand accounts, sponsorship terms                |

Also write up: the five business model stages with pricing as assumptions to test, the moat, go-to-market, and how outcome data (plan 14) makes Encore learn which taste signals actually convert.

## Part B: stretch enhancements (ranked; build only after plan 19's checklist is green)

1. **Shareable plan link**: an owner shares a read-only link to their plan with a partner or co-owner (signed, expiring URL; RLS through a share token table). Raises Design.
2. **Plan comparison**: compare two runs for the same venue (different weekdays or radii) side by side. Raises Technological Implementation.
3. **"Why this works" explainer**: use `feature.explainability=true` from Qloo to show which inputs drove each affinity, with receipts. Raises Technological Implementation and Quality of the Idea.
4. **Heatmap view**: if plan 02 showed `urn:heatmap` is useful, a small map of where in the neighbourhood the taste concentrates. Raises Design.
5. **In-app assistant** (from UNoN plan 09): a read-only helper that answers "why did you suggest this?" from the stored run and receipts. Only with time to test it properly.
6. **GitHub Actions CI**: run `validate` and `db:test` on every push with a Supabase local stack.
7. **Spanish UI copy** for US venues where it matters (copy in config, not hard-coded).

Each enhancement, if picked, gets its own plan from the template before any code.

## Deliverables

- [ ] `docs/roadmap.md` written for all five roadmap items, business model, moat and go-to-market
- [ ] Linked from the README and the Devpost "What's next" section
- [ ] Stretch enhancements ranked here; any that are built have their own plan and meet every standard

## Verification

The user reads `docs/roadmap.md` and agrees it matches the brief and is honest about what is not built.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read this plan, the brief's roadmap, business model and moat sections, and the tables and modules named above.

Write `docs/roadmap.md` first. Start a stretch enhancement only if plan 19's checklist is fully ticked and the user agrees, and write its plan from the template before any code. No long dashes. Do not commit unless asked.
