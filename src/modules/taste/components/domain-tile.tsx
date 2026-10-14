import { CircleSlash, TriangleAlert } from "lucide-react"
import { SectionCard } from "@/components/shared/section-card"
import type { TasteDomainResult } from "../taste.schemas"

// One domain of the fingerprint, ranked. Empty and failed domains say so; they are never left blank or dropped.
export function DomainTile({ result }: { result: TasteDomainResult }) {
  const [top, ...rest] = result.status === "ok" ? result.items : []

  return (
    <SectionCard title={result.label}>
      {top && (
        <ol className="space-y-1.5">
          <li
            className="font-display text-xl leading-tight font-bold text-balance break-words sm:text-2xl"
            title={top.name}
          >
            {top.name}
          </li>
          {rest.map((item) => (
            <li key={item.id} className="truncate text-sm text-muted-foreground" title={item.name}>
              {item.name}
            </li>
          ))}
        </ol>
      )}
      {result.status === "empty" && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleSlash aria-hidden className="size-4 shrink-0" />
          Not enough data nearby
        </p>
      )}
      {result.status === "failed" && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          Could not read this one. It is retried on the next run.
        </p>
      )}
    </SectionCard>
  )
}
