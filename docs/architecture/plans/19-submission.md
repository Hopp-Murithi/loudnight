# Plan 19: Submission: write-up, screenshots, video and pilot

Status: Not started
Depends on: all core plans (03 to 14), 17, 18
Phase: 5 (the pilot venue is arranged in phase 2 so real numbers exist by Oct 28)
Judging criteria: all four, made explicit for the judges

## Goal

Loudnight is submitted on Devpost by Oct 29 with everything the rules and the brief's checklist ask for, and the write-up and video make each judging criterion easy to score: how deeply Qloo is used, how complete the product is, the real impact with real numbers, and why the idea is original.

## Brief coverage

Submission checklist (all items). Two-minute walkthrough script. "How to protect the edge before Oct 30: run Loudnight at one or two real venues, even small ones, and put the real check-in numbers in the submission." Hackathon facts and requirements: public repository with an open-source licence, written explanation of functionality and Qloo integration, video. Business model and go-to-market for the impact case.

## Scope

In: README final, `docs/submission.md` (the Devpost text for the user to paste), Qloo usage section endpoint by endpoint, architecture diagram, screenshots, the two-minute video script and shot list, pilot venue plan and results, eligibility confirmation, the final checklist.
Out: recording and editing the video (the user records; this plan supplies the script, shot list and captions).

## Design

### Write-up (`docs/submission.md`, sections in Devpost order)

1. Inspiration and the problem (dead nights, guesswork, copycat trivia, generic AI makes it worse).
2. What it does (the owner journey in six steps).
3. **How we use Qloo**, endpoint by endpoint: which `/v2/insights` `filter.type` values and signals, `/search`, `/v2/tags`, demographic signals, how affinities become concepts and scores, the grounding rule and receipts, caching. Numbers from the Powered by Qloo panel (calls per run, cache hit rate).
4. How we built it (architecture diagram, the six-step spine, streaming, RLS, Preview as).
5. Challenges (thin location data and how the probe decided; grounding; timeouts).
6. Accomplishments (the receipt trigger, the toggle, the pilot).
7. What we learned.
8. What's next (plan 20's roadmap and business model).
9. Judging criteria map: one short paragraph per official criterion pointing at what to click.

### Screenshots

Trace mid-run, concept card with an open receipt, Generic vs Loudnight side by side, launch kit, event page on a phone, door screen, dashboard with the calculator. Captured at 1440 and 390 in light mode, plus one dark. Stored in `docs/submission/` (our own UI only; no Qloo raw responses visible beyond the receipt slice).

### Video (two minutes, following the brief's script)

| Time      | Shot                                                                    | Line                                                                                    |
| --------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 0:00-0:15 | The Copper Room demo, Generic tab                                       | "This bar in Brooklyn is empty every Tuesday. Here's what a normal AI tells the owner." |
| 0:15-0:45 | Toggle to Loudnight, trace replay: neighbourhood, competitors, concepts | What each step found, with sources on screen                                            |
| 0:45-1:10 | Open a concept, tap an evidence chip, receipt sheet                     | "Every number has a receipt from Qloo."                                                 |
| 1:10-1:35 | Choose it: calendar, talent, poster, posts                              | One tap to a launch kit                                                                 |
| 1:35-1:50 | Event page on a phone, RSVP, door scan, dashboard ticks up              | "Who actually came."                                                                    |
| 1:50-2:00 | Calculator and the pilot result                                         | "Qloo knows the taste. Loudnight fills the room."                                       |

Captions burned in; no music over the voice; under 2:00.

### Pilot venue

- Phase 2: the user approaches one or two friendly venues (anywhere; label honestly if outside the US and Qloo coverage is weaker). Agree a night in the week of Oct 20 to 27.
- Run Loudnight for their venue, publish one night, use the door screen on the night, log spend if they agree.
- Record: RSVPs, check-ins, show-up rate, break-even distance, owner quote (with written permission). If no pilot happens, say so plainly; never invent or round up numbers.

### Eligibility and rules (from plan 02)

Confirm in this plan before submitting: eligibility for residents of Kenya, prize payment, the start-date rule, licence, video rules, team size.

## Final checklist

- [ ] Live URL works on desktop and phone in a logged-out browser
- [ ] 3 preloaded demo venues return results instantly
- [ ] Public repository, MIT licence, README with setup, architecture and Qloo usage
- [ ] No Qloo response data and no secrets in the repository (plan 16 scans pass)
- [ ] Devpost write-up complete, with the judging criteria map
- [ ] Screenshots of trace, concept card, launch kit, dashboard (and the rest above)
- [ ] Two-minute video uploaded and linked
- [ ] Pilot venue result and owner quote, if available, labelled honestly
- [ ] Eligibility and rules confirmed
- [ ] Submitted by Oct 29; Oct 30 kept free for fixes

## Deliverables

The final checklist above, plus `docs/submission.md` reviewed by the user before pasting.

## Verification

Open the Devpost preview; follow every link in it from a logged-out phone; watch the video end to end at 1x speed.

## Prompt

---

You are working on Loudnight. Follow `CLAUDE.md` exactly, including the no-long-dashes rule in the write-up. Read this plan, the brief, the plans README's judging criteria section, and every Done plan's Deliverables for facts to cite. Use only verified numbers from the database and the Powered by Qloo panel.

Write `docs/submission.md` and the README sections, capture screenshots in a browser, write the video script and captions, and fill in the pilot section from real data. Ask the user to review before anything is posted. Never submit on the user's behalf. Tick boxes only when verified. Do not commit unless asked.
