import { CalendarDays } from "lucide-react"
import Image from "next/image"
import { photoForVenue } from "@/config/night-photos"
import { VENUE_TYPE_LABELS, WEEKDAY_LABELS } from "@/config/venues"
import { townOf } from "@/lib/address"
import { VENUE_ROLE_LABELS } from "@/modules/team/team.schemas"
import type { VenueDetail } from "../venues.schemas"

// Every page about a venue opens on a night out: its own photo, its name on the marquee, its quiet night lit.
export function VenueBanner({ venue }: { venue: VenueDetail }) {
  const photo = photoForVenue(venue.id)
  const city = townOf(venue)

  return (
    <section
      aria-label={venue.name}
      className="dark relative -mx-4 -mt-4 overflow-hidden bg-background text-foreground sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8"
    >
      <Image
        src={photo.image}
        alt=""
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        className="venue-photo object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-linear-to-r from-background via-background/80 to-background/30" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-background/90 to-transparent" />
      <div className="relative flex min-h-44 flex-col justify-end gap-3 px-4 pt-10 pb-6 sm:min-h-52 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          {VENUE_TYPE_LABELS[venue.venueType]}
          {city ? ` in ${city}` : ""}
        </p>
        <h1 className="font-display text-5xl leading-[0.9] font-extrabold text-balance sm:text-6xl">{venue.name}</h1>
        <div className="flex flex-wrap items-center gap-2 pt-1 text-sm">
          {venue.settings && (
            <span className="inline-flex items-center gap-1.5 bg-spotlight px-2.5 py-1 font-medium text-primary-foreground">
              <CalendarDays aria-hidden className="size-4" />
              {venue.settings.quietNights.length > 1 ? "Quiet nights" : "Quiet night"}:{" "}
              {venue.settings.quietNights.map((night) => WEEKDAY_LABELS[night]).join(", ")}
            </span>
          )}
          <span className="border border-white/25 px-2.5 py-1 text-white/85">{VENUE_ROLE_LABELS[venue.role]}</span>
        </div>
      </div>
      <a
        href={photo.source}
        target="_blank"
        rel="noreferrer"
        className="absolute right-3 bottom-2 text-[0.65rem] text-white/50 hover:text-white"
      >
        Photo: {photo.author} ({photo.license})
      </a>
    </section>
  )
}
