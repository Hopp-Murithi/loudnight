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

// One domain of the fingerprint, ranked. Empty and failed domains say so; they are never left blank or dropped.
export function DomainTile({ result }: { result: TasteDomainResult }) {
  const Icon = DOMAIN_ICONS[result.domain as TasteDomainId] ?? Sparkles
  const [top, ...rest] = result.status === "ok" ? result.items : []

  return (
    <SectionCard title={result.label} action={<Icon aria-hidden className="size-4 text-muted-foreground" />}>
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
