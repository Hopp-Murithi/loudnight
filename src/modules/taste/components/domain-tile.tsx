import {
  BookOpen,
  Building2,
  CircleSlash,
  Clapperboard,
  Mic,
  Music,
  Plane,
  ShoppingBag,
  Sparkles,
  TriangleAlert,
  Tv,
  Users,
  type LucideIcon,
} from "lucide-react"
import { SectionCard } from "@/components/shared/section-card"
import type { TasteDomainId } from "@/config/taste"
import type { TasteDomainResult } from "../taste.schemas"

const DOMAIN_ICONS: Record<TasteDomainId, LucideIcon> = {
  music_styles: Music,
  place_styles: Sparkles,
  music: Mic,
  places: Building2,
  film: Clapperboard,
  tv: Tv,
  brands: ShoppingBag,
  books: BookOpen,
  podcasts: Mic,
  people: Users,
  destinations: Plane,
}

const affinityText = (value: number) => value.toFixed(2)

// One domain of the fingerprint. Empty and failed domains say so; they are never left blank or dropped.
export function DomainTile({ result }: { result: TasteDomainResult }) {
  const Icon = DOMAIN_ICONS[result.domain as TasteDomainId] ?? Sparkles

  return (
    <SectionCard
      title={result.label}
      description={result.status === "ok" ? "What people nearby love most" : undefined}
      action={<Icon aria-hidden className="size-4 text-muted-foreground" />}
    >
      {result.status === "ok" && (
        <ol className="space-y-2">
          {result.items.map((item) => (
            <li key={item.id} className="flex min-w-0 items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate" title={item.name}>
                {item.name}
              </span>
              <span className="shrink-0 border border-spotlight/60 bg-spotlight/12 px-1.5 py-0.5 text-xs tabular-nums">
                <span className="sr-only">Affinity </span>
                {affinityText(item.affinity)}
              </span>
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
