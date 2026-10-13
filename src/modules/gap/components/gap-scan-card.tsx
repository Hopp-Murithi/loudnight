import { Info } from "lucide-react"
import { WEEKDAY_LABELS, type Weekday } from "@/config/venues"
import { formatDistance } from "@/lib/geo"
import { formatLocalDate } from "@/lib/format"
import { TYPE } from "@/lib/typography"
import type { GapScan, Scout } from "../gap.schemas"
import { CoveredThemes } from "./covered-themes"
import { NearbyVenues, NightEvents } from "./nearby-lists"
import { ScoutSummary } from "./scout-summary"

interface GapScanCardProps {
  scan: GapScan
  scout: Scout | null
  radiusMetres: number
}

// Pipeline steps 1 and 3 made visible: the venue as Google sees it, then what the night already offers nearby.
export function GapScanCard({ scan, scout, radiusMetres }: GapScanCardProps) {
  const weekday = scan.weekday as Weekday
  const nightLabel = `${WEEKDAY_LABELS[weekday]}s`
  const from = scan.nights[0] ? formatLocalDate(scan.nights[0], { month: "short", day: "numeric" }) : null

  return (
    <section aria-labelledby="gap-heading" className="space-y-5">
      <div className="space-y-1">
        <h2 id="gap-heading" className={TYPE.h2}>
          What is already on, {nightLabel} nearby
        </h2>
        <p className="text-sm text-muted-foreground">
          {scan.nights.length} {nightLabel}
          {from ? ` from ${from}` : ""}, within {formatDistance(radiusMetres)}. New nights steer away from these.
        </p>
      </div>

      {scout && <ScoutSummary scout={scout} weekday={weekday} />}

      {scan.noveltyNeutral && (
        <p role="status" className="flex items-start gap-2 border border-info/40 bg-info/10 p-3 text-sm">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
          Neither Google Places nor Ticketmaster answered, so freshness is scored as neutral for this plan.
        </p>
      )}

      {scan.themes.length > 0 && <CoveredThemes themes={scan.themes} />}
      {scan.sources.themes === "failed" && !scan.noveltyNeutral && (
        <p className="text-sm text-muted-foreground">The planner could not group these into themes this time.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <NearbyVenues venues={scan.venues} failed={scan.sources.places === "failed"} />
        <NightEvents events={scan.events} failed={scan.sources.events === "failed"} nightLabel={nightLabel} />
      </div>
    </section>
  )
}
