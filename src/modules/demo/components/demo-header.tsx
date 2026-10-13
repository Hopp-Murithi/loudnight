import { CalendarDays, Users } from "lucide-react"
import Image from "next/image"
import { photoForVenue } from "@/config/night-photos"
import { VENUE_TYPE_LABELS, WEEKDAY_LABELS } from "@/config/venues"
import { cityOf } from "@/lib/address"
import type { DemoVenueView } from "../demo.schemas"

// The demo venue on its marquee: where it is, the night it cannot fill, and what a good night needs.
export function DemoHeader({ venue, plannedAt }: { venue: DemoVenueView; plannedAt: string | null }) {
  const photo = photoForVenue(venue.id)
  const city = cityOf(venue.address)

  return (
    <header className="dark relative overflow-hidden bg-background text-foreground">
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
      <div className="relative mx-auto flex min-h-64 max-w-6xl flex-col justify-end gap-3 px-4 pt-14 pb-8 sm:px-6">
        <p className="text-sm text-muted-foreground">
          Demo venue: a {VENUE_TYPE_LABELS[venue.venueType].toLowerCase()}
          {city ? ` in ${city}` : ""}
        </p>
        <h1 className="font-display text-6xl leading-[0.9] font-extrabold text-balance sm:text-7xl">{venue.name}</h1>
        <ul className="flex flex-wrap items-center gap-2 pt-1 text-sm">
          <li className="inline-flex items-center gap-1.5 bg-spotlight px-2.5 py-1 font-medium text-primary-foreground">
            <CalendarDays aria-hidden className="size-4" />
            Quiet night: {WEEKDAY_LABELS[venue.slowNight]}
          </li>
          <li className="inline-flex items-center gap-1.5 border border-white/25 px-2.5 py-1 text-white/85">
            <Users aria-hidden className="size-4" />
            Needs {venue.breakEvenHeadcount} people to break even
          </li>
        </ul>
        {plannedAt && (
          <p className="max-w-xl pt-2 text-sm text-muted-foreground">
            Planned by Encore on {plannedAt}. Nothing here was typed in by hand: the same six steps run for every venue.
          </p>
        )}
      </div>
      <a
        href={photo.source}
        target="_blank"
        rel="noreferrer"
        className="absolute right-3 bottom-2 text-[0.65rem] text-white/50 hover:text-white"
      >
        Photo: {photo.author} ({photo.license})
      </a>
    </header>
  )
}
