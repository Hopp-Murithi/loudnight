import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerSupabase } from "@/lib/supabase/server"
import { TYPE } from "@/lib/typography"
import { SelfCheckIn } from "@/modules/door/components/self-checkin"
import { readEventPage } from "@/modules/events/events.read"

export const metadata: Metadata = { title: "Check in", robots: { index: false, follow: false } }

// Where the QR on the door leads: a guest without a ticket counts themselves in.
export default async function SelfCheckInPage({ params }: PageProps<"/e/[slug]/here">) {
  const event = await readEventPage(await createServerSupabase(), (await params).slug)
  if (!event) notFound()
  return (
    <article className="mx-auto max-w-md space-y-6 text-center">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Welcome to {event.venue.name}</p>
        <h1 className={TYPE.h1}>{event.title}</h1>
      </div>
      {event.paused ? (
        <p role="status">This venue is not taking check-ins right now.</p>
      ) : event.status === "cancelled" ? (
        <p role="status">This night has been cancelled.</p>
      ) : (
        <SelfCheckIn slug={event.slug} venueName={event.venue.name} />
      )}
    </article>
  )
}
