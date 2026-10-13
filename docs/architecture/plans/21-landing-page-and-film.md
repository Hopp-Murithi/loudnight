# Plan 21: Landing page and product film

Status: In progress
Depends on: 01, 03
Phase: 2 (added Oct 13 at the user's request: the landing page looked bare)
Judging criteria: Design (complete, coherent product), Quality of the Idea (the generic-versus-Encore contrast), Potential Impact (the money on screen)

## Goal

The landing page tells Encore's story in one scroll: a quiet night, what a chatbot says about it, what Encore does instead, why every number can be trusted, what a full night is worth, and real neighbourhoods to try. A short product film, rendered with Remotion from the same brand tokens, shows the whole journey in about 20 seconds without anyone needing to sign up.

## Brief coverage

"The hook: this bar in Brooklyn is empty every Tuesday. Here's what a normal AI tells the owner." The Generic AI vs Encore contrast. "Every claim links to the Qloo result behind it." "Unit logic for the pitch: 30 guests at $20 each, about $2,400 a month, against a $49 to $99 subscription." "Closes the loop: decide, execute, promote, measure."

## Design

### Product film (`video/`, its own Remotion project)

- A separate package in `video/` with pinned Remotion packages, kept out of the app's TypeScript, ESLint, Prettier and Vercel uploads. It reuses the venue night photos from `src/assets/nights`.
- 1280 x 720, 30 fps, about 20 seconds, looping cleanly. Scenes, one component each, joined with `TransitionSeries`:
  1. Quiet: a dim room, "Tuesday, 9:04 pm", a counter stuck at 6 guests.
  2. Reading the neighbourhood: the trace ticks through Google Places, Qloo and Ticketmaster.
  3. The concept: "Afrobeats Tuesdays", the fit score counting to 82, evidence chips arriving.
  4. The launch kit: a poster and posts for each channel fanning out.
  5. The door: the counter climbs past the break-even line as the room fills.
  6. End card: the mark and "Fill your quiet nights."
- Everything in the film is labelled as a sample; it shows the product, not real results.
- Rendered to `public/media/encore-film.mp4` (H.264) with a poster frame `public/media/encore-film.jpg`; target under 2.5 MB.

### Landing page sections (`/`)

1. **Hero** (always night: ink background in both themes): headline, one line, two actions (Plan your quiet night, Watch the demo venues), the film in a framed screen beside it on desktop and below on phones. The film is muted, autoplays only without reduced motion, and has a visible pause control.
2. **Ask a chatbot, ask Encore**: the same quiet Tuesday answered twice. Left: the generic list (trivia, karaoke, open mic). Right: a specific night with its evidence chips. Labelled as a sample.
3. **One loop**: decide, execute, promote, measure, as four connected steps with what Encore makes at each.
4. **No number without a receipt**: an evidence chip opening onto the Qloo response slice it came from, explained in two sentences.
5. **What a full night is worth**: an interactive calculator (extra guests, spend per guest) showing the monthly gain against the subscription, using the brief's own example as the default.
6. **Demo venues**: the three real neighbourhoods, with their photos.
7. **Closing band**: a night photo, one line, the sign-up action.

### Rules

- Real photos only from `src/assets/nights` (credited); no invented logos or testimonials.
- Every sample number is marked "Sample". The calculator shows the maths, not a promise.
- Motion: the film and one entrance per section; nothing else moves. Reduced motion shows the film's poster frame with a play button.
- Screen standard from the plans README applies.

## Deliverables

- [x] `video/` Remotion project with six scene components and a parent film, pinned versions, excluded from the app's tooling
- [x] Film rendered to MP4 under 2.5 MB with a poster frame, loops cleanly (1.2 MB, 560 frames; `npm run render` and `npm run poster` in `video/`)
- [x] Landing page sections 1 to 7 built from shared components and tokens
- [x] Film control: pause and play, muted, `playsInline`, poster under reduced motion
- [x] Calculator with tests for its maths
- [ ] `npm run validate` passes; page checked at 390, 768, 1280 and 1440 in both themes
- [ ] Deployed to production

## Notes

- The landing page lives in its own route group, `(landing)`, so its bands can run full width under a night header (`PublicShell bleed`); other public pages keep the boxed layout.
- The old six-step journey list is replaced by the four-stage loop.
- Headless Chrome on Windows will not go narrower than about 500px, so phone width was checked at 520px; 390px is for the user's review.

## Verification

`npm run validate`; `npx remotion render` in `video/`; the user reviews the page at the four widths.

## Revision, Oct 13: two slides

The owner's feedback was that the page had too much going on. It is now two screens, always night:

1. The hero with the film.
2. The use case as five pictures ("From an empty Tuesday to a full room"), a gallery on a laptop and a row to swipe on a phone, with three links to finished demo plans beneath.

The two-answers block, the loop, the receipt explorer and the night-value calculator (with its maths and tests) were removed from the page and the code. The Generic vs Encore contrast and the receipts now live on the demo pages (plan 09), where they are real rather than samples. Blocks rise in as they enter the screen where the browser supports scroll-driven animation, and are simply visible otherwise and under reduced motion. A signed-in visitor sees "Your venues" in the header instead of "Sign in".
