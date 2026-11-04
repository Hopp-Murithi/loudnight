"use client"

import { useRef, type CSSProperties } from "react"
import { STAGE_SCENES } from "@/config/landing"
import type { LandingRegion } from "@/config/landing-regions"
import { stageVars } from "./stage-math"
import { SceneCopy, StageDots } from "./stage-copy"
import { AreaLayer, FinaleLayer, WorldLayer } from "./stage-maps"
import { LightsLayer, RoomLayer } from "./stage-room"
import { useSceneStage } from "./use-scene-stage"

const SCENES = STAGE_SCENES.length
// The first frame, drawn on the server, so nothing flashes before the page wakes up.
const FIRST_FRAME = stageVars(0, SCENES) as CSSProperties

interface NightStageProps {
  region: LandingRegion
  signedIn: boolean
  exampleHref: string | null
}

// The landing page as one still stage: each scroll or swipe moves the story one scene, zooming into the visitor's world.
export function NightStage({ region, signedIn, exampleHref }: NightStageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const { scene, goTo } = useSceneStage(stageRef, SCENES)

  return (
    <div className="stage-track">
      <div ref={stageRef} className="relative h-svh overflow-hidden bg-background" style={FIRST_FRAME}>
        <WorldLayer region={region} />
        <AreaLayer region={region} active={scene === 1} />
        <RoomLayer region={region} active={scene === 2} />
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
            region={region}
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
