import Image from "next/image"
import { adPhotoFor } from "@/config/night-photos"
import { formatNightTime } from "@/lib/format"
import type { EventPageView } from "../events.schemas"

const longDate = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone }).format(new Date(iso))

// The top of the event page reads like the poster: a photo of a night like this one, the name, and when.
export function EventHero({ event }: { event: EventPageView }) {
  const photo = adPhotoFor(event.venueId, event.sequence)
  return (
    <header className="dark poster-glow relative overflow-hidden text-foreground">
      <Image
        src={photo.image}
        alt=""
        fill
        priority
        sizes="(min-width: 640px) 640px, 100vw"
        placeholder="blur"
        className="object-cover opacity-60"
      />
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
      <div className="relative flex min-h-[22rem] flex-col justify-end gap-4 p-5 sm:min-h-[26rem] sm:p-8">
        <p className="text-sm text-foreground/85">
          {event.venue.name}, {event.venue.town}
        </p>
        <h1 className="font-display text-5xl leading-[0.95] font-extrabold text-balance sm:text-6xl">{event.title}</h1>
        <p className="self-start bg-spotlight px-3 py-1.5 font-display text-2xl font-bold text-primary-foreground">
          <time dateTime={event.startsAt}>
            {longDate(event.startsAt, event.venue.timeZone)}, {formatNightTime(event.startsAt, event.venue.timeZone)}
          </time>
        </p>
      </div>
    </header>
  )
}
