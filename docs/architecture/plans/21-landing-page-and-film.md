# Plan 21: Landing page and product film

Status: In progress
Depends on: 01, 03
Phase: 2 (added Oct 13 at the user's request: the landing page looked bare)
Judging criteria: Design (complete, coherent product), Quality of the Idea (the generic-versus-Loudnight contrast), Potential Impact (the money on screen)

## Goal

The landing page tells Loudnight's story in one scroll: a quiet night, what a chatbot says about it, what Loudnight does instead, why every number can be trusted, what a full night is worth, and real neighbourhoods to try. A short product film, rendered with Remotion from the same brand tokens, shows the whole journey in about 20 seconds without anyone needing to sign up.

## Brief coverage

"The hook: this bar in Brooklyn is empty every Tuesday. Here's what a normal AI tells the owner." The Generic AI vs Loudnight contrast. "Every claim links to the Qloo result behind it." "Unit logic for the pitch: 30 guests at $20 each, about $2,400 a month, against a $49 to $99 subscription." "Closes the loop: decide, execute, promote, measure."

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
2. **Ask a chatbot, ask Loudnight**: the same quiet Tuesday answered twice. Left: the generic list (trivia, karaoke, open mic). Right: a specific night with its evidence chips. Labelled as a sample.
3. **One loop**: decide, execute, promote, measure, as four connected steps with what Loudnight makes at each.
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

The two-answers block, the loop, the receipt explorer and the night-value calculator (with its maths and tests) were removed from the page and the code. The Generic vs Loudnight contrast and the receipts now live on the demo pages (plan 09), where they are real rather than samples. Blocks rise in as they enter the screen where the browser supports scroll-driven animation, and are simply visible otherwise and under reduced motion. A signed-in visitor sees "Your venues" in the header instead of "Sign in".

## Revision, Oct 14: one stage, five scenes

The owner asked for the page to behave like the slide deck: scrolling should not move the page, it should move the story on, with the background zooming from the world into Kenya, into a venue, then party lights, then the world lit up.

- `components/landing/night-stage.tsx`: a pinned stage (`position: sticky`) inside a track five screens tall. `use-scroll-stage.ts` turns the scroll into a position from 0 to 4 and writes style values straight onto the stage each frame, so scrolling never re-renders React; only a change of scene does. The maths is in `stage-math.ts`, tested.
- Scenes: the world at night (one light on Nairobi), Kenya with its towns lit and an area's tastes, a room with the night Loudnight found pinned to it, coloured spotlights sweeping in from the corners over "And fills it.", and the world again with a light coming on in one city after another.
- Words hand over faster than pictures, so two headlines are never on screen together. Only the scene on screen can be read or focused (`inert` on the others). Dots beside the stage jump to any scene.
- Maps: dotted world and Kenya maps generated once with `dotted-map` (MIT) and saved as static SVG in `public/landing`; the app gains no dependency. Pin positions are in `config/landing.ts`.
- Reduced motion: scenes cross-fade; nothing zooms, sweeps or pulses.
- Removed: the hero with the film, the five-picture story, the demo venue list. One quiet "See an example plan" link stays in the last scene so judges still reach a finished plan without an account. Signed-in visitors are sent to their venues instead of being asked to sign in.
- Checked at 1440 and 390 pixels in the dev server, every scene and mid-scroll. Not yet checked: 768 and 1280, keyboard-only, a real phone.

## Revision, Oct 14 (later): the visitor's own country, one scroll per scene

The owner asked for the zoom to follow the visitor (Kenya for Kenya, the US for the US, Europe, Asia) and for one scroll to change one scene, with no empty frames, on a mouse, a touchpad and a phone.

- Region: the page reads Vercel's `x-vercel-ip-country` header and picks one of twelve regions (US, Kenya, Nigeria, South Africa, UK, Germany, France, India, Japan, Brazil, Mexico, Australia); neighbouring countries go to the nearest one; unknown means the US. Nothing about the visitor is stored. `/?region=<id>` shows any region, for demos.
- Each region has its own dotted map, six towns, six tastes, an example night and a closing line (`config/landing-regions.ts`). Maps are generated once with dotted-map (`config/landing-maps.ts` holds the positions).
- Scroll: one snap point per scene (`scroll-snap-type: y mandatory`, `scroll-snap-stop: always`) for touch and the keyboard. A real wheel notch of 100 pixels was snapped back to the same scene in testing, so wheel and trackpad gestures are handled in `use-scroll-stage.ts`: one gesture moves exactly one scene, and a gesture ends after 220 ms without wheel events, so a trackpad's long tail cannot skip scenes. Past the last scene the page scrolls on to the credits.
- Pictures now cross-fade straight into each other (the visibilities always add up to one), so no frame is empty. Words still hand over faster, one headline at a time.
- Soft spotlights over the first and last scenes; full ones in scene four.
- The header floats over the first scene on the home page only.
- Checked with real wheel input in headless Chrome (each notch moved exactly one scene, the fifth reached the credits), and screenshots of Kenya, the US, the UK and Japan at 1440 and 390 pixels.
