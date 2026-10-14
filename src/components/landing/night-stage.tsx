"use client"

import { useRef, type CSSProperties } from "react"
import { STAGE_SCENES } from "@/config/landing"
import { stageVars } from "./stage-math"
import { SceneCopy, StageDots } from "./stage-copy"
import { FinaleLayer, KenyaLayer, WorldLayer } from "./stage-maps"
import { LightsLayer, RoomLayer } from "./stage-room"
import { useScrollStage } from "./use-scroll-stage"

const SCENES = STAGE_SCENES.length
// The first frame, drawn on the server, so nothing flashes before the page wakes up.
const FIRST_FRAME = stageVars(0, SCENES) as CSSProperties

interface NightStageProps {
  signedIn: boolean
  exampleHref: string | null
}

// The landing page as one pinned stage. Scrolling does not move the page: it moves the story on, scene by scene.
export function NightStage({ signedIn, exampleHref }: NightStageProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const { scene, goTo } = useScrollStage(trackRef, stageRef, SCENES)

  return (
    <div ref={trackRef} className="relative" style={{ height: `${SCENES * 100}svh` }}>
      <div ref={stageRef} className="sticky top-0 h-svh overflow-hidden bg-background" style={FIRST_FRAME}>
        <WorldLayer />
        <KenyaLayer active={scene === 1} />
        <RoomLayer active={scene === 2} />
        <LightsLayer />
        <FinaleLayer active={scene === 4} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-r from-background/90 via-background/40 to-transparent"
        />
        {STAGE_SCENES.map((entry, index) => (
          <SceneCopy
            key={entry.id}
            index={index}
            active={index === scene}
            signedIn={signedIn}
            exampleHref={exampleHref}
          />
        ))}
        <StageDots scene={scene} onGo={goTo} />
        {scene === 0 && (
          <p aria-hidden className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
            <span className="scroll-cue inline-block">Scroll</span>
          </p>
        )}
      </div>
    </div>
  )
}
