import Image from "next/image"
import Link from "next/link"
import type { CSSProperties } from "react"
import { Button } from "@/components/ui/button"
import { NIGHT_READY, STAGE_SCENES } from "@/config/landing"
import type { LandingRegion } from "@/config/landing-regions"
import { ROUTES } from "@/config/site"
import { TYPE } from "@/lib/typography"
import { cn } from "@/lib/utils"

interface SceneCopyProps {
  index: number
  active: boolean
  region: LandingRegion
  signedIn: boolean
  exampleHref: string | null
}

const textIn = (index: number): CSSProperties => ({
  opacity: `var(--t${index})`,
  transform: `translateY(calc((1 - var(--t${index})) * 1.5rem))`,
})

// What the scene says. Only the scene on screen can be read or reached, so a screen reader hears one at a time.
export function SceneCopy({ index, active, region, signedIn, exampleHref }: SceneCopyProps) {
  const scene = STAGE_SCENES[index]
  const Heading = index === 0 ? "h1" : "h2"
  return (
    <div
      aria-hidden={!active}
      inert={!active}
      className="absolute inset-x-0 bottom-0 px-4 pb-16 sm:px-6 sm:pb-20 lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2 lg:pb-0"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-xl space-y-4" style={textIn(index)}>
          <Heading className={cn(TYPE.display, scene.id === "lights" && "lit-text")}>{scene.title}</Heading>
          <p className={cn(TYPE.lead, "text-foreground/85")}>
            {scene.id === "anywhere" ? region.anywhere : scene.line}
          </p>
          {scene.id === "area" && <Tastes tastes={region.tastes} place={region.place} active={active} />}
          {scene.id === "lights" && <ReadyList active={active} />}
          {(scene.id === "world" || scene.id === "anywhere") && (
            <Start signedIn={signedIn} exampleHref={scene.id === "anywhere" ? exampleHref : null} />
          )}
        </div>
      </div>
    </div>
  )
}

function Tastes({ tastes, place, active }: { tastes: readonly string[]; place: string; active: boolean }) {
  return (
    <ul aria-label={`What an area in ${place} might love`} className="flex flex-wrap gap-2 pt-1">
      {tastes.map((taste, index) => (
        <li
          key={taste}
          className={cn(
            "border border-spotlight/50 bg-background/70 px-2.5 py-1 text-sm backdrop-blur",
            active && "taste-in",
          )}
          style={{ "--taste-delay": `${0.15 + index * 0.1}s` } as CSSProperties}
        >
          {taste}
        </li>
      ))}
    </ul>
  )
}

function ReadyList({ active }: { active: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-3 pt-2 lg:grid-cols-4">
      {NIGHT_READY.map((item, index) => (
        <li
          key={item.label}
          className={cn(
            "overflow-hidden rounded-md border border-foreground/15 bg-foreground/[0.06] shadow-2xl backdrop-blur-md",
            active && "taste-in",
          )}
          style={{ "--taste-delay": `${0.2 + index * 0.12}s` } as CSSProperties}
        >
          <div className="relative aspect-[4/3] border-b border-foreground/10">
            <Image
              src={item.image}
              alt={item.alt}
              fill
              sizes="(min-width: 1024px) 12rem, 45vw"
              className="object-cover object-top"
            />
          </div>
          <p className="px-3 py-2 text-sm leading-snug font-medium">{item.label}</p>
        </li>
      ))}
    </ul>
  )
}

// Someone already signed in goes straight to their venues instead of being asked to sign in again.
function Start({ signedIn, exampleHref }: { signedIn: boolean; exampleHref: string | null }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <Button size="lg" nativeButton={false} render={<Link href={signedIn ? ROUTES.venues : ROUTES.signup} />}>
        {signedIn ? "Go to your venues" : "Plan your quiet night"}
      </Button>
      {!signedIn && (
        <Button size="lg" variant="outline" nativeButton={false} render={<Link href={ROUTES.login} />}>
          Sign in
        </Button>
      )}
      {exampleHref && (
        <Link href={exampleHref} className="text-sm text-link underline-offset-4 hover:underline">
          See an example plan, no account needed
        </Link>
      )}
    </div>
  )
}

interface StageDotsProps {
  scene: number
  onGo: (index: number) => void
}

// Where the visitor is in the story, and a way to jump to any scene.
export function StageDots({ scene, onGo }: StageDotsProps) {
  return (
    <nav aria-label="Story" className="absolute top-1/2 right-6 hidden -translate-y-1/2 sm:block">
      <ol className="flex flex-col gap-2">
        {STAGE_SCENES.map((entry, index) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onGo(index)}
              aria-label={entry.title}
              aria-current={index === scene ? "step" : undefined}
              className="grid size-8 place-items-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                className={cn(
                  "block w-1 transition-all duration-300 motion-reduce:transition-none",
                  index === scene ? "h-6 bg-spotlight" : "h-2 bg-foreground/40",
                )}
              />
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
