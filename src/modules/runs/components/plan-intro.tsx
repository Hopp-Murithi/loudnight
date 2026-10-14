import { Clock } from "lucide-react"
import { PIPELINE } from "@/config/runs"
import type { Weekday } from "@/config/venues"
import { TYPE } from "@/lib/typography"
import { StartRunButton } from "./start-run"

// The empty state for planning: what will happen, how long it takes, and the one thing to do.
export function PlanIntro({
  venueId,
  weekday,
  night,
  canRun,
}: {
  venueId: string
  weekday: Weekday | undefined
  night: string
  canRun: boolean
}) {
  return (
    <section
      aria-labelledby="intro-heading"
      className="dark poster-glow grid gap-10 p-6 text-foreground sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
    >
      <div className="space-y-5">
        <span aria-hidden className="block h-1.5 w-12 bg-spotlight" />
        <h2 id="intro-heading" className={TYPE.h1}>
          Find the {night} nobody nearby is running.
        </h2>
        <p className="text-muted-foreground">
          Encore reads your neighbourhood&apos;s taste, checks what is on around you, and invents nights backed by
          evidence you can open.
        </p>
        {canRun && weekday ? (
          <div className="flex flex-wrap items-center gap-4">
            <StartRunButton venueId={venueId} weekday={weekday} label={`Plan my ${night}`} />
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock aria-hidden className="size-4" />
              About a minute. You can leave and come back.
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            An owner or manager starts a plan. It appears here when they do.
          </p>
        )}
      </div>
      <ol className="space-y-4">
        {PIPELINE.map((entry, index) => (
          <li key={entry.step} className="flex gap-4">
            <span className="w-6 shrink-0 font-display text-2xl leading-none font-bold text-muted-foreground tabular-nums">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{entry.label}</p>
              <p className="text-sm text-muted-foreground">{entry.what}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
