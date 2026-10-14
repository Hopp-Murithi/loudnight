# Plan 28: Spanish where it matters

Status: Built, checked on screen (Oct 14)
Depends on: 11 (the ad studio)
Phase: 5 (stretch, from plan 20 part B)
Judging criteria: Potential Impact

## Goal

A venue whose neighbours speak Spanish makes its poster, video and captions in Spanish with one tap. The ad is where language decides whether someone comes, so that is where Spanish goes first.

## Brief coverage

Plan 20 part B item 7: "Spanish UI copy for US venues where it matters (copy in config, not hard-coded)."

## Scope

In: the words Encore writes onto an ad and into its captions, in English and Spanish, held in config; a language choice in the ad studio saved with the design.
Out: translating the owner's dashboard (owners chose English at sign-up; a full interface translation is its own project), translating the night's name or the owner's own extra line (those are theirs), the guest event page (plan 12 will read the same config).

## Design

- `config/ad-copy.ts`: one object per language with every phrase the ad and captions use ("With {act}", "Come early, bring someone.", "See you there?", the caption shapes). No phrase lives in a component or in the caption builder.
- Dates are formatted with the language's own locale (`en-US`, `es-US`), so weekdays and months come out right without a word list.
- `adDesignSchema` gains `language` (`en` or `es`, default `en`). A design saved before this plan reads as English.
- `adContent` and `caption` take the language from the design. Hashtags stay as they are: they come from proper names.

## Screens

- **Promote**: a two-way "Language" choice above "One more line". Changing it redraws the ad and rewrites the four captions at once.

## Tests

Spanish content (weekday, month, "Con {act}"), Spanish captions inside each limit, the schema default for older designs, every English key present in Spanish.

## Deliverables

- [x] Poster, video and captions in Spanish from one choice
- [x] Every Encore-written phrase on an ad comes from config in both languages
- [x] Older saved designs still open, in English

## Verification

`npm run validate`; on Promote switch to Spanish, check the date line and the four captions.

## Prompt

---

You are working on Encore. Follow `CLAUDE.md` exactly. Read this plan and `modules/promote`. Order: config, schema, copy builder with tests, the control. No long dashes. Do not commit unless asked.
