import Link from "next/link"
import { ToneBadge } from "@/components/shared/tone-badge"
import { ROUTES } from "@/config/site"
import { TYPE } from "@/lib/typography"
import type { EventPageView } from "../events.schemas"

const LIST = new Intl.ListFormat("en-US", { style: "long", type: "conjunction" })

const mapLink = (event: EventPageView) =>
  `https://www.google.com/maps/search/?api=1&query=${event.venue.latitude},${event.venue.longitude}`

// The notice a guest sees first when the night will not happen as planned.
export function EventNotice({ event }: { event: EventPageView }) {
  if (event.status === "cancelled")
    return (
      <div role="status" className="space-y-1 border-l-2 border-destructive bg-destructive/10 p-4">
        <ToneBadge tone="danger" label="Cancelled" />
        <p className="text-sm">
          {event.venue.name} has cancelled this night. Nothing for you to do; your place is released.
        </p>
      </div>
    )
  if (event.paused)
    return (
      <div role="status" className="space-y-1 border-l-2 border-warning bg-warning/10 p-4">
        <ToneBadge tone="warning" label="Not taking bookings" />
        <p className="text-sm">{event.venue.name} is not taking bookings on Loudnight right now.</p>
      </div>
    )
  if (event.past)
    return (
      <div role="status" className="space-y-2 border-l-2 border-border bg-muted p-4 text-sm">
        <p>This night has happened.</p>
        {event.nextSlug && (
          <Link href={ROUTES.eventPage(event.nextSlug)} className="text-link underline-offset-4 hover:underline">
            See the next one
          </Link>
        )}
      </div>
    )
  return null
}

// What to expect and where to go.
export function EventBody({ event }: { event: EventPageView }) {
  return (
    <div className="space-y-6">
      {event.blurb && <p className={TYPE.lead}>{event.blurb}</p>}
      <dl className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        {event.lineup.length > 0 && (
          <>
            <dt className="text-sm text-muted-foreground">Playing</dt>
            <dd>{LIST.format(event.lineup)}</dd>
          </>
        )}
        <dt className="text-sm text-muted-foreground">This week</dt>
        <dd>{event.twist}</dd>
        <dt className="text-sm text-muted-foreground">Where</dt>
        <dd className="space-y-1">
          <span className="block">{event.venue.name}</span>
          <span className="block text-sm text-muted-foreground">{event.venue.address}</span>
          <a
            href={mapLink(event)}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-link underline-offset-4 hover:underline"
          >
            Open in Google Maps<span className="sr-only">, opens in a new tab</span>
          </a>
        </dd>
      </dl>
    </div>
  )
}
