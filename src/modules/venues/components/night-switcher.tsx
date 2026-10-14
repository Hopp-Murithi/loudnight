import Link from "next/link"
import { ROUTES } from "@/config/site"
import { WEEKDAY_LABELS, type Weekday } from "@/config/venues"
import { cn } from "@/lib/utils"

type NightPage = "venue" | "venuePlan" | "venueSeries" | "venuePromote"

// Each quiet night has its own plan, series and ads. Shown only when a venue has more than one.
export function NightSwitcher({
  venueId,
  nights,
  current,
  page,
}: {
  venueId: string
  nights: readonly Weekday[]
  current: Weekday
  page: NightPage
}) {
  if (nights.length < 2) return null
  return (
    <nav aria-label="Quiet nights" className="flex flex-wrap gap-1 bg-muted/60 p-1 sm:w-fit">
      {nights.map((night) => (
        <Link
          key={night}
          href={ROUTES[page](venueId, night)}
          aria-current={night === current ? "page" : undefined}
          className={cn(
            "inline-flex min-h-9 flex-1 items-center justify-center px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:flex-none",
            night === current && "bg-background text-foreground shadow-sm",
          )}
        >
          {WEEKDAY_LABELS[night]}
        </Link>
      ))}
    </nav>
  )
}
