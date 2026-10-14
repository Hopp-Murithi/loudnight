import Image from "next/image"
import type { CSSProperties } from "react"
import cocktailBar from "@/assets/nights/cocktail-bar.webp"
import danceFloor from "@/assets/nights/dance-floor.webp"
import type { LandingRegion } from "@/config/landing-regions"
import { cn } from "@/lib/utils"

const LAYER = "pointer-events-none absolute inset-0 overflow-hidden"

// Scene three: inside one venue. The room comes into focus and the night Encore found is pinned to it like a ticket.
export function RoomLayer({ region, active }: { region: LandingRegion; active: boolean }) {
  return (
    <div aria-hidden className={LAYER} style={{ opacity: "var(--v2)" }}>
      <div className="stage-zoom absolute inset-0" style={{ transform: "scale(var(--room-zoom))" }}>
        <Image src={cocktailBar} alt="" fill sizes="100vw" placeholder="blur" className="object-cover opacity-70" />
      </div>
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-background/10" />
      <div
        className={cn(
          "absolute top-[14%] right-4 w-64 border border-spotlight/60 bg-background/85 p-4 shadow-2xl backdrop-blur sm:right-[8%] sm:w-72",
          active && "taste-in",
        )}
      >
        <p className="text-xs text-spotlight">The night nobody nearby runs</p>
        <p className="mt-1 font-display text-3xl leading-none font-bold">{region.night.name}</p>
        <p className="mt-2 text-sm text-muted-foreground">{region.night.when}</p>
        <div aria-hidden className="mt-3 border-t border-dashed border-spotlight/50" />
        <p className="mt-2 text-xs text-muted-foreground">
          Picked because people around you love it and nobody near you runs it.
        </p>
      </div>
    </div>
  )
}

const BEAMS = [
  { color: "var(--spotlight)", corner: "-top-[80vmax] -left-[80vmax]", from: "120deg", time: "5.5s", delay: "0s" },
  {
    color: "var(--party-magenta)",
    corner: "-top-[80vmax] -right-[80vmax]",
    from: "210deg",
    time: "4.6s",
    delay: "-1.2s",
  },
  {
    color: "var(--party-cyan)",
    corner: "-bottom-[80vmax] -left-[80vmax]",
    from: "30deg",
    time: "6.2s",
    delay: "-2.4s",
  },
  {
    color: "var(--party-violet)",
    corner: "-bottom-[80vmax] -right-[80vmax]",
    from: "300deg",
    time: "5s",
    delay: "-0.6s",
  },
]

// Coloured beams sweeping in from each corner. Soft ones light the opening and closing scenes; full ones fill scene four.
export function SpotBeams({ soft = false }: { soft?: boolean }) {
  return (
    <div className={cn("absolute inset-0", soft && "opacity-35")}>
      {BEAMS.map((beam) => (
        <span
          key={beam.color}
          className={cn("spot-beam", beam.corner)}
          style={
            {
              "--beam": beam.color,
              "--beam-from": beam.from,
              "--beam-time": beam.time,
              "--beam-delay": beam.delay,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

// Scene four: the lights come up across a full room.
export function LightsLayer() {
  return (
    <div aria-hidden className={LAYER} style={{ opacity: "var(--v3)" }}>
      <Image src={danceFloor} alt="" fill sizes="100vw" placeholder="blur" className="object-cover opacity-30" />
      <div className="absolute inset-0 bg-background/55" />
      <SpotBeams />
    </div>
  )
}
