import type { CSSProperties, ReactNode } from "react"
import { WORLD_RATIO, WORLD_TOWNS } from "@/config/landing-maps"
import { regionMap, type LandingRegion } from "@/config/landing-regions"
import { cn } from "@/lib/utils"
import { SpotBeams } from "./stage-room"

const LAYER = "pointer-events-none absolute inset-0 overflow-hidden"
const visible = (scene: number): CSSProperties => ({ opacity: `var(--v${scene})` })

interface MapProps {
  src: string
  ratio: string
  width: string
  zoom: string
  origin: { x: number; y: number }
  // Sits to the right of the words on wide screens instead of behind them.
  side?: boolean
  children?: ReactNode
}

// A dotted map that zooms about one point, with its pins drawn in the same box so they stay on their towns.
function DottedMap({ src, ratio, width, zoom, origin, side = false, children }: MapProps) {
  return (
    <div
      className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
        side && "top-[34%] lg:top-1/2 lg:left-[72%] lg:[--map-room:50vw]",
      )}
      style={{ width, aspectRatio: ratio }}
    >
      <div
        className="stage-zoom relative size-full"
        style={{ transform: `scale(var(${zoom}))`, transformOrigin: `${origin.x}% ${origin.y}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG drawing, nothing for the optimiser to do */}
        <img src={src} alt="" className="size-full" />
        {children}
      </div>
    </div>
  )
}

// A country as large as fits: three quarters of the screen's height beside the words on wide screens, half of it above
// the words on a phone.
function fitWidth(ratio: string): string {
  const [width, height] = ratio.split("/").map(Number)
  return `min(92vw, ${Math.round((78 * width) / height)}svh, var(--map-room, ${Math.round((50 * width) / height)}svh))`
}

const pinAt = (pin: { x: number; y: number }, delay: number): CSSProperties =>
  ({ left: `${pin.x}%`, top: `${pin.y}%`, "--pin-delay": `${delay}s` }) as CSSProperties

// Scene one: the whole world at night under soft stage lights, one light on the visitor's part of it, closing in.
export function WorldLayer({ region }: { region: LandingRegion }) {
  const focus = regionMap(region.id).world
  return (
    <div aria-hidden className={LAYER} style={visible(0)}>
      <SpotBeams soft />
      <DottedMap
        src="/landing/world.svg"
        ratio={WORLD_RATIO}
        width="max(115vw, 210svh)"
        zoom="--world-zoom"
        origin={focus}
      >
        <span className="map-pin" style={pinAt(focus, 0)} />
      </DottedMap>
    </div>
  )
}

// Scene two: the visitor's own country, its towns lit, the biggest brightest.
export function AreaLayer({ region, active }: { region: LandingRegion; active: boolean }) {
  const map = regionMap(region.id)
  const [main] = map.towns
  return (
    <div aria-hidden className={LAYER} style={visible(1)}>
      <DottedMap
        src={`/landing/${region.id}.svg`}
        ratio={map.ratio}
        width={fitWidth(map.ratio)}
        zoom="--area-zoom"
        origin={main}
        side
      >
        {map.towns.map((town, index) => (
          <span key={town.name} className={cn("map-pin", active && "pin-on")} style={pinAt(town, index * 0.12)}>
            <span className="absolute top-1/2 left-4 -translate-y-1/2 text-xs font-medium whitespace-nowrap text-foreground/80">
              {town.name}
            </span>
          </span>
        ))}
      </DottedMap>
    </div>
  )
}

// The last scene: the world again, a light coming on in one city after another.
export function FinaleLayer({ active }: { active: boolean }) {
  return (
    <div aria-hidden className={LAYER} style={visible(4)}>
      <SpotBeams soft />
      <DottedMap
        src="/landing/world.svg"
        ratio={WORLD_RATIO}
        width="max(110vw, 200svh)"
        zoom="--finale-zoom"
        origin={{ x: 50, y: 50 }}
      >
        {WORLD_TOWNS.map((town, index) => (
          <span key={town.name} className={cn("map-pin", active && "pin-on")} style={pinAt(town, 0.2 + index * 0.14)} />
        ))}
      </DottedMap>
    </div>
  )
}
