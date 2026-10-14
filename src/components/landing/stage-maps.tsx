import type { CSSProperties } from "react"
import { KENYA_PINS, WORLD_FOCUS, WORLD_PINS } from "@/config/landing"
import { cn } from "@/lib/utils"

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
  children?: React.ReactNode
}

// A dotted map that zooms about one point, with its pins drawn in the same box so they stay on their towns.
function DottedMap({ src, ratio, width, zoom, origin, side = false, children }: MapProps) {
  return (
    <div
      className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", side && "lg:left-[66%]")}
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

const pinAt = (pin: { x: number; y: number }, delay: number): CSSProperties =>
  ({ left: `${pin.x}%`, top: `${pin.y}%`, "--pin-delay": `${delay}s` }) as CSSProperties

// Scene one: the whole world at night, one light on Nairobi, closing in as the visitor scrolls.
export function WorldLayer() {
  return (
    <div aria-hidden className={LAYER} style={visible(0)}>
      <DottedMap
        src="/landing/world.svg"
        ratio="140 / 71"
        width="max(115vw, 210svh)"
        zoom="--world-zoom"
        origin={WORLD_FOCUS}
      >
        <span className="map-pin" style={pinAt(WORLD_FOCUS, 0)} />
      </DottedMap>
    </div>
  )
}

// Scene two: Kenya, its towns lit, Nairobi brightest.
export function KenyaLayer({ active }: { active: boolean }) {
  const [nairobi] = KENYA_PINS
  return (
    <div aria-hidden className={LAYER} style={visible(1)}>
      <DottedMap
        src="/landing/kenya.svg"
        ratio="71 / 91"
        width="min(80svh, 92vw)"
        zoom="--kenya-zoom"
        origin={nairobi}
        side
      >
        {KENYA_PINS.map((pin, index) => (
          <span key={pin.name} className={cn("map-pin", active && "pin-on")} style={pinAt(pin, index * 0.12)}>
            <span className="absolute top-1/2 left-4 -translate-y-1/2 text-xs font-medium whitespace-nowrap text-foreground/80">
              {pin.name}
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
      <DottedMap
        src="/landing/world.svg"
        ratio="140 / 71"
        width="max(110vw, 200svh)"
        zoom="--finale-zoom"
        origin={{ x: 50, y: 50 }}
      >
        {WORLD_PINS.map((pin, index) => (
          <span key={pin.name} className={cn("map-pin", active && "pin-on")} style={pinAt(pin, 0.2 + index * 0.14)} />
        ))}
      </DottedMap>
    </div>
  )
}
