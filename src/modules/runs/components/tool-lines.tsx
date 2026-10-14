import type { ToolSource } from "@/config/runs"
import { cn } from "@/lib/utils"
import type { ToolLine } from "../runs.schemas"

const SOURCE_STYLE: Record<ToolSource, string> = {
  Qloo: "bg-spotlight/20 text-foreground",
  "Google Places": "bg-info/12 text-info",
  Ticketmaster: "bg-success/12 text-success",
  Claude: "bg-muted text-muted-foreground",
  Loudnight: "bg-primary/12 text-primary",
}

export function SourceBadge({ source }: { source: ToolSource }) {
  return <span className={cn("shrink-0 px-1.5 py-0.5 text-[0.7rem] font-medium", SOURCE_STYLE[source])}>{source}</span>
}

export const seconds = (ms: number | null) => (ms === null ? "" : `${(ms / 1000).toFixed(1)} s`)

// Every call a step made, folded away by default so the findings stay the headline.
export function ToolLines({ lines }: { lines: ToolLine[] }) {
  if (lines.length === 0) return null
  return (
    <details className="group">
      <summary className="cursor-pointer text-xs text-muted-foreground underline-offset-4 hover:underline">
        {lines.length === 1 ? "1 call" : `${lines.length} calls`}
      </summary>
      <ul className="mt-2 space-y-1.5">
        {lines.map((line) => (
          <li key={line.id} className="flex min-w-0 items-center gap-2 text-xs">
            <SourceBadge source={line.source} />
            <span className={cn("min-w-0 flex-1 truncate", !line.ok && "text-destructive")} title={line.label}>
              {line.label}
              {!line.ok && " (did not answer)"}
            </span>
            {line.fromCache && <span className="shrink-0 text-muted-foreground">cached</span>}
            <span className="shrink-0 text-muted-foreground tabular-nums">{seconds(line.latencyMs)}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}
