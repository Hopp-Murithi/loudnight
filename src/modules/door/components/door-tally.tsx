"use client"

import { MeterBar } from "@/components/shared/meter-bar"
import type { DoorArrival, DoorView } from "../door.schemas"
import { formatClock } from "@/lib/format"

// The one number the door watches all night, against break-even when the viewer may see it.
export function DoorCount({ numbers, breakEven }: { numbers: DoorView["numbers"]; breakEven: number | null }) {
  return (
    <section aria-label="Tonight so far" className="space-y-3 border bg-card p-5">
      <p className="font-display text-6xl leading-none font-extrabold tabular-nums">
        {numbers.arrived}
        <span className="ml-2 text-2xl font-semibold text-muted-foreground">
          {breakEven ? `of ${breakEven} to break even` : "in tonight"}
        </span>
      </p>
      {breakEven ? (
        <MeterBar
          label="Guests against break-even"
          value={numbers.arrived}
          max={Math.max(breakEven, numbers.arrived)}
          valueText={`${numbers.arrived} of ${breakEven}`}
          tone={numbers.toBreakEven === 0 ? "success" : "info"}
        />
      ) : null}
      <p className="text-sm text-muted-foreground">
        {numbers.rsvps} saved places, {numbers.walkIns} walk-ins
        {numbers.showUpRate !== null && `, ${Math.round(numbers.showUpRate * 100)}% of RSVPs here`}
      </p>
    </section>
  )
}

// The last few people through the door, newest first.
export function RecentArrivals({ arrivals }: { arrivals: DoorArrival[] }) {
  if (arrivals.length === 0) return null
  return (
    <section aria-labelledby="recent-heading" className="space-y-2">
      <h2 id="recent-heading" className="text-sm font-medium text-muted-foreground">
        Just in
      </h2>
      <ul className="divide-y border text-sm">
        {arrivals.map((arrival) => (
          <li key={arrival.id} className="flex justify-between gap-3 px-3 py-2">
            <span>
              {arrival.name ?? "Walk-in"}
              {arrival.partySize > 1 && `, ${arrival.partySize}`}
            </span>
            <span className="text-muted-foreground">{formatClock(arrival.at)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
