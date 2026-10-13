import { SCORE_PARTS } from "@/config/concepts"
import type { ConceptView } from "../concepts.schemas"

// The total as the formula builds it: each part shows the points it earned out of its weight.
export function ScoreBreakdown({ scores }: { scores: ConceptView["scores"] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <span className="font-display text-6xl leading-[0.8] font-extrabold tabular-nums">{scores.total}</span>
        <span className="pb-0.5 text-sm text-muted-foreground">out of 100</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-3">
        {SCORE_PARTS.map((part) => {
          const points = Math.round(scores[part.key] * part.weight)
          return (
            <div key={part.key} className="min-w-0 space-y-1" title={part.hint}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <dt className="truncate text-muted-foreground">{part.label}</dt>
                <dd className="shrink-0 tabular-nums">
                  {points}
                  <span className="text-muted-foreground"> of {part.weight}</span>
                </dd>
              </div>
              <div aria-hidden className="h-1 bg-muted">
                <div className="h-full bg-primary" style={{ width: `${(points / part.weight) * 100}%` }} />
              </div>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
