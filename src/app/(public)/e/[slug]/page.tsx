import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerSupabase } from "@/lib/supabase/server"
import { EventActions } from "@/modules/events/components/event-actions"
import { EventBody, EventNotice } from "@/modules/events/components/event-body"
import { EventHero } from "@/modules/events/components/event-hero"
import { ReserveSection } from "@/modules/events/components/reserve-section"
import { eventUrl } from "@/modules/events/events.links"
import { readEventPage } from "@/modules/events/events.read"

type Props = PageProps<"/e/[slug]">

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await readEventPage(await createServerSupabase(), (await params).slug)
  if (!event) return { title: "Night not found" }
  const description = event.blurb ?? `${event.title} at ${event.venue.name}, ${event.venue.town}.`
  return { title: `${event.title} at ${event.venue.name}`, description, openGraph: { title: event.title, description } }
}

// A night's public page: guests come from a post or a poster's QR, see what it is, and save a place.
export default async function EventPage({ params }: Props) {
  const event = await readEventPage(await createServerSupabase(), (await params).slug)
  if (!event) notFound()
  const open = event.status === "published" && !event.past && !event.paused

  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <EventHero event={event} />
      <EventNotice event={event} />
      <EventBody event={event} />
      <EventActions
        slug={event.slug}
        url={eventUrl(event.slug)}
        title={event.title}
        startsAt={event.startsAt}
        description={event.blurb ?? event.twist}
        location={`${event.venue.name}, ${event.venue.address}`}
      />
      {open && <ReserveSection slug={event.slug} venueName={event.venue.name} />}
    </article>
  )
}
