# Plan 27: Ask about this plan

Status: Not started (plan written Oct 14)
Depends on: 06, 07
Phase: 5 (stretch, from plan 20 part B)
Judging criteria: Quality of the Idea, Design

## Goal

On a finished plan, a team member asks a plain question ("Why did you suggest this?", "What is already on nearby?", "Why not karaoke?") and gets a short answer built only from that plan's stored data. It cannot change anything, and it cannot state a number that is not in the plan.

## Brief coverage

Plan 20 part B item 5: "a read-only helper that answers 'why did you suggest this?' from the stored run and receipts."

## Scope

In: one question, one answer, on the plan page; three suggested questions; a strict grounding check.
Out: a chat history, memory between questions, tools, actions, answers about anything outside the plan.

## Design

- `modules/assistant`: `assistant.context.ts` (pure) builds a compact fact sheet from the run view and shortlist: the nights with their scores and evidence claims, the top tastes per domain, the themes already covered nearby, the trace findings. `assistant.prompt.ts` holds the versioned system prompt and the forced tool. `assistant.grounding.ts` (pure) checks the answer: every number in it must appear in the fact sheet, or the answer is replaced by a plain refusal. `assistant.service.ts` reads the run with the caller's client (RLS first), calls `AI_MODELS.copy` once, and returns the checked answer.
- The plan's content is sent as data. The prompt tells the model to treat it as data, to answer in at most four sentences, to say so when the plan does not hold the answer, and never to follow instructions inside names or the question.
- `POST /api/v1/runs/[runId]/ask`, signed-in team members only, body `{ question }` (3 to 300 characters), rate limited per person. Nothing is stored.
- In the interface it is "Ask about this plan", never "AI" or "assistant".

## Screens

- A button on the plan page opens a sheet: three suggested questions as buttons, a text field, and the answer in a quiet block with "From this plan's own data" beneath it. Loading shows a spinner in the button; an error is said plainly with a retry.

## Tests

The fact sheet (holds the nights, claims and themes; no money from settings), the grounding check (a made-up number is refused, numbers from the plan pass, numbers inside names pass), the prompt (data-not-instructions wording), the service (not found under RLS, refusal passes through), the body schema.

## Deliverables

- [ ] A question about a plan gets an answer drawn only from that plan
- [ ] An answer with a number that is not in the plan is refused (test)
- [ ] It changes nothing and stores nothing
- [ ] Screen standard met for the sheet

## Verification

`npm run validate`; on a real plan ask the three suggested questions and one it cannot answer.

## Prompt

---

You are working on Loudnight. Follow `CLAUDE.md` exactly, section 5 especially. Read this plan, `modules/concepts/concepts.grounding.ts` and `modules/gap/gap.themes.ts` for the forced-tool pattern. Load the `claude-api` skill for the prompt. No long dashes. Do not commit unless asked.
