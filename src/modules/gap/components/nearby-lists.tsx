import { Star, TriangleAlert } from "lucide-react"
import type { ReactNode } from "react"
import { SectionCard } from "@/components/shared/section-card"
import { formatDistance } from "@/lib/geo"
import { formatLocalDate } from "@/lib/format"
import type { NearbyEvent, NearbyVenue } from "../gap.schemas"

const VISIBLE_ROWS = 6

function Source({ children }: { children: ReactNode }) {
  return <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">{children}</p>
}

function Failed({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-destructive">
      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  )
}

// Long lists stay calm: the first rows show, the rest open on request without any script.
function Rows<T>({ items, render, more }: { items: T[]; render: (item: T) => ReactNode; more: string }) {
  const head = items.slice(0, VISIBLE_ROWS)
  const rest = items.slice(VISIBLE_ROWS)
  return (
    <>
      <ul className="divide-y">{head.map(render)}</ul>
      {rest.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer py-2 text-sm text-link underline-offset-4 group-open:hidden hover:underline">
            Show {rest.length} more {more}
          </summary>
          <ul className="divide-y border-t">{rest.map(render)}</ul>
        </details>
      )}
    </>
  )
}

export function NearbyVenues({ venues, failed }: { venues: NearbyVenue[]; failed: boolean }) {
  return (
    <SectionCard
      title="Nearby venues"
      description={failed ? undefined : `${venues.length} places competing for the night`}
    >
      {failed ? (
        <Failed>Google Places did not answer, so the themes come from events only.</Failed>
      ) : (
        <Rows
          items={venues}
          more="venues"
          render={(venue) => (
            <li key={venue.placeId} className="flex min-w-0 items-center justify-between gap-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{venue.name}</p>
                <p className="truncate text-xs text-muted-foreground">{venue.type}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground tabular-nums">
                {venue.rating !== null && (
                  <span className="inline-flex items-center gap-1">
                    <Star aria-hidden className="size-3" />
                    <span className="sr-only">Rated </span>
                    {venue.rating.toFixed(1)}
                  </span>
                )}
                {venue.distanceMetres !== null && <span>{formatDistance(venue.distanceMetres)}</span>}
              </div>
            </li>
          )}
        />
      )}
      <Source>From Google Places</Source>
    </SectionCard>
  )
}

export function NightEvents({
  events,
  failed,
  nightLabel,
}: {
  events: NearbyEvent[]
  failed: boolean
  nightLabel: string
}) {
  return (
    <SectionCard
      title={`On ${nightLabel} nearby`}
      description={failed ? undefined : "Ticketed events over the next four weeks"}
    >
      {failed && <Failed>Ticketmaster did not answer, so the themes come from venues only.</Failed>}
      {!failed && events.length === 0 && (
        <p className="flex items-start gap-2 text-sm">Nothing ticketed on {nightLabel} nearby. That is your opening.</p>
      )}
      {!failed && events.length > 0 && (
        <Rows
          items={events}
          more="events"
          render={(event) => (
            <li key={event.id} className="flex min-w-0 items-center gap-4 py-2.5">
              <time
                dateTime={event.localDate}
                className="flex w-10 shrink-0 flex-col items-center border py-1 leading-none"
              >
                <span className="text-[0.65rem] text-muted-foreground">
                  {formatLocalDate(event.localDate, { month: "short" })}
                </span>
                <span className="font-display text-lg font-bold">
                  {formatLocalDate(event.localDate, { day: "numeric" })}
                </span>
              </time>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" title={event.name}>
                  {event.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {[event.genre, event.venue].filter(Boolean).join(", ") || "Event"}
                </p>
              </div>
            </li>
          )}
        />
      )}
      <Source>From Ticketmaster</Source>
    </SectionCard>
  )
}
