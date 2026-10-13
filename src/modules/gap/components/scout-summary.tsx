import { Clock, Star, Store } from "lucide-react"
import { WEEKDAY_LABELS, type Weekday } from "@/config/venues"
import type { Scout } from "../gap.schemas"

// What Google Places says about the venue itself, so the owner sees what the planner sees.
export function ScoutSummary({ scout, weekday }: { scout: Scout; weekday: Weekday }) {
  const dayLabel = WEEKDAY_LABELS[weekday]
  const hours = scout.hours
    .find((line) => line.startsWith(dayLabel))
    ?.slice(dayLabel.length + 1)
    .trim()

  return (
    <dl className="grid gap-x-8 gap-y-3 border bg-muted/30 p-4 text-sm sm:grid-cols-3">
      <div className="flex items-center gap-2">
        <Store aria-hidden className="size-4 text-muted-foreground" />
        <dt className="sr-only">Type</dt>
        <dd>{scout.type ?? "Venue"}</dd>
      </div>
      <div className="flex items-center gap-2">
        <Star aria-hidden className="size-4 text-muted-foreground" />
        <dt className="sr-only">Rating</dt>
        <dd className="tabular-nums">
          {scout.rating === null
            ? "Not rated yet"
            : `${scout.rating.toFixed(1)} from ${scout.ratingCount ?? 0} reviews`}
        </dd>
      </div>
      <div className="flex items-center gap-2">
        <Clock aria-hidden className="size-4 text-muted-foreground" />
        <dt className="sr-only">{dayLabel} hours</dt>
        <dd>{hours ? `${dayLabel}s ${hours}` : `No ${dayLabel} hours listed`}</dd>
      </div>
    </dl>
  )
}
