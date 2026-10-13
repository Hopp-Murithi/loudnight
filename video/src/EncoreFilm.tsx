import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { useVideoConfig } from "remotion";
import { ConceptScene } from "./scenes/ConceptScene";
import { DoorScene } from "./scenes/DoorScene";
import { EndScene } from "./scenes/EndScene";
import { LaunchScene } from "./scenes/LaunchScene";
import { QuietScene } from "./scenes/QuietScene";
import { ReadingScene } from "./scenes/ReadingScene";

export const SCENE_FRAMES = { quiet: 90, reading: 120, concept: 120, launch: 105, door: 120, end: 80 } as const;
export const FADE_FRAMES = 15;

// From a dead Tuesday to a full room in about 20 seconds.
export const EncoreFilm = () => {
  const { fps } = useVideoConfig();
  const crossfade = <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: FADE_FRAMES })} />;

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Quiet" durationInFrames={SCENE_FRAMES.quiet} premountFor={fps}>
        <QuietScene />
      </TransitionSeries.Sequence>
      {crossfade}
      <TransitionSeries.Sequence name="Reading" durationInFrames={SCENE_FRAMES.reading} premountFor={fps}>
        <ReadingScene />
      </TransitionSeries.Sequence>
      {crossfade}
      <TransitionSeries.Sequence name="Concept" durationInFrames={SCENE_FRAMES.concept} premountFor={fps}>
        <ConceptScene />
      </TransitionSeries.Sequence>
      {crossfade}
      <TransitionSeries.Sequence name="Launch" durationInFrames={SCENE_FRAMES.launch} premountFor={fps}>
        <LaunchScene />
      </TransitionSeries.Sequence>
      {crossfade}
      <TransitionSeries.Sequence name="Door" durationInFrames={SCENE_FRAMES.door} premountFor={fps}>
        <DoorScene />
      </TransitionSeries.Sequence>
      {crossfade}
      <TransitionSeries.Sequence name="End" durationInFrames={SCENE_FRAMES.end} premountFor={fps}>
        <EndScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

export const FILM_FRAMES =
  Object.values(SCENE_FRAMES).reduce((total, frames) => total + frames, 0) - 5 * FADE_FRAMES;
