import { Composition, Folder } from "remotion";
import { EncoreFilm, FILM_FRAMES, SCENE_FRAMES } from "./EncoreFilm";
import { ConceptScene } from "./scenes/ConceptScene";
import { DoorScene } from "./scenes/DoorScene";
import { EndScene } from "./scenes/EndScene";
import { LaunchScene } from "./scenes/LaunchScene";
import { QuietScene } from "./scenes/QuietScene";
import { ReadingScene } from "./scenes/ReadingScene";

const SIZE = { width: 1280, height: 720, fps: 30 } as const;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="EncoreFilm" component={EncoreFilm} durationInFrames={FILM_FRAMES} {...SIZE} />
    <Folder name="Scenes">
      <Composition id="Quiet" component={QuietScene} durationInFrames={SCENE_FRAMES.quiet} {...SIZE} />
      <Composition id="Reading" component={ReadingScene} durationInFrames={SCENE_FRAMES.reading} {...SIZE} />
      <Composition id="Concept" component={ConceptScene} durationInFrames={SCENE_FRAMES.concept} {...SIZE} />
      <Composition id="Launch" component={LaunchScene} durationInFrames={SCENE_FRAMES.launch} {...SIZE} />
      <Composition id="Door" component={DoorScene} durationInFrames={SCENE_FRAMES.door} {...SIZE} />
      <Composition id="End" component={EndScene} durationInFrames={SCENE_FRAMES.end} {...SIZE} />
    </Folder>
  </>
);
