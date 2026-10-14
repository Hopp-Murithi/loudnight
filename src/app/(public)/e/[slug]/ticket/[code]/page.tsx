import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ROUTES } from "@/config/site"
import { formatNightTime } from "@/lib/format"
import { createServerSupabase } from "@/lib/supabase/server"
import { TYPE } from "@/lib/typography"
import { EventActions } from "@/modules/events/components/event-actions"
import { StaffCheckIn } from "@/modules/door/components/staff-checkin"
import { doorService } from "@/modules/door/door.service"
import { QrCode } from "@/modules/events/components/qr-code"
import { isCheckinCode } from "@/modules/events/events.codes"
import { eventUrl, ticketUrl } from "@/modules/events/events.links"
import { readEventPage } from "@/modules/events/events.read"

// A ticket's link is its secret: never listed by search engines.
export const metadata: Metadata = { title: "Your ticket", robots: { index: false, follow: false } }

const longDate = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone }).format(new Date(iso))

export default async function TicketPage({ params }: PageProps<"/e/[slug]/ticket/[code]">) {
  const { slug, code } = await params
  if (!isCheckinCode(code)) notFound()
  const supabase = await createServerSupabase()
  const event = await readEventPage(supabase, slug)
  if (!event) notFound()
  const staff = await doorService.ticketForStaff(supabase, event.nightId, code)

  return (
    <article className="mx-auto max-w-md space-y-6 text-center">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">You&apos;re on the list</p>
        <h1 className={TYPE.h1}>{event.title}</h1>
        <p>
          {longDate(event.startsAt, event.venue.timeZone)}, {formatNightTime(event.startsAt, event.venue.timeZone)}
        </p>
        <p className="text-sm text-muted-foreground">{event.venue.name}</p>
      </div>
      {event.status === "cancelled" && (
        <p role="status" className="border-l-2 border-destructive bg-destructive/10 p-3 text-left text-sm">
          This night has been cancelled. Your ticket will not be needed.
        </p>
      )}
      {staff && <StaffCheckIn code={code} {...staff} />}
      <div className="mx-auto grid place-items-center gap-3 border bg-white p-5">
        <QrCode value={ticketUrl(event.slug, code)} label={`Ticket QR code for ${code}`} />
        <p className="font-mono text-lg tracking-[0.3em] text-black">{code.toUpperCase()}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Show this at the door. Turn your screen brightness up. Keep this page: it is your ticket.
      </p>
      <EventActions
        slug={event.slug}
        url={eventUrl(event.slug)}
        title={event.title}
        startsAt={event.startsAt}
        description={event.blurb ?? event.twist}
        location={`${event.venue.name}, ${event.venue.address}`}
      />
      <Link
        href={ROUTES.eventPage(event.slug)}
        className="inline-block text-sm text-link underline-offset-4 hover:underline"
      >
        Back to the night
      </Link>
    </article>
  )
}
