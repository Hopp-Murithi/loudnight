import "server-only"
import { AppError, conflict, fromDatabaseError, notFound } from "@/lib/http/errors"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { RequestContext } from "@/modules/auth/types"
import { codeFrom } from "@/modules/events/events.codes"
import { readEventPage } from "@/modules/events/events.read"
import { managedVenue } from "@/modules/venues/venues.access"
import { toCents, type VenueDetail } from "@/modules/venues/venues.schemas"
import { venuesService } from "@/modules/venues/venues.service"
import { nightNumbers } from "./door.metrics"
import { doorRepository } from "./door.repository"
import type { CheckinInput, CheckinResult, DoorView } from "./door.schemas"

const HOUR = 3_600_000
// A night stays at the door until six hours after it starts; guests may check themselves in from an hour before.
const OPEN_BEFORE = HOUR
const OPEN_AFTER = 6 * HOUR
const RECENT = 5

type Night = NonNullable<Awaited<ReturnType<typeof doorRepository.findNight>>>

async function build(ctx: RequestContext, night: Night, venue: VenueDetail): Promise<DoorView> {
  const [list, arrivals, logged] = await Promise.all([
    doorRepository.guestList(ctx.supabase, night.id),
    doorRepository.arrivals(ctx.supabase, night.id),
    venue.settings ? doorRepository.loggedSpend(ctx.supabase, night.id) : Promise.resolve(null),
  ])
  const arrivedAt = new Map(arrivals.flatMap((row) => (row.rsvp_id ? [[row.rsvp_id, row.created_at] as const] : [])))
  const names = new Map(list.map((row) => [row.id, row.guest_name]))
  const { takingsCents, takingsLogged, ...numbers } = nightNumbers({
    guests: list.map((row) => ({ id: row.id, partySize: row.party_size })),
    arrivals: arrivals.map((row) => ({ rsvpId: row.rsvp_id, partySize: row.party_size })),
    breakEven: venue.settings?.breakEvenHeadcount ?? 0,
    averageSpendCents: venue.settings ? toCents(venue.settings.averageSpend) : 0,
    loggedSpendCents: logged,
  })
  return {
    night: {
      id: night.id,
      slug: night.public_slug,
      title: night.title ?? venue.name,
      startsAt: night.starts_at,
      status: night.status,
      timeZone: venue.timeZone,
    },
    breakEven: venue.settings?.breakEvenHeadcount ?? null,
    guests: list.map((row) => ({
      id: row.id,
      name: row.guest_name,
      partySize: row.party_size,
      arrivedAt: arrivedAt.get(row.id) ?? null,
    })),
    recent: arrivals.slice(0, RECENT).map((row) => ({
      id: row.id,
      name: row.rsvp_id ? (names.get(row.rsvp_id) ?? null) : null,
      partySize: row.party_size,
      at: row.created_at,
    })),
    numbers,
    money: venue.settings ? { takingsCents, takingsLogged, currency: venue.currency } : null,
  }
}

// Tonight at the door: the first published night that has not finished. Null when nothing is on.
export async function readDoor(ctx: RequestContext, venueId: string, now = new Date()): Promise<DoorView | null> {
  const venue = await venuesService.getDetail(ctx, venueId)
  const night = await doorRepository.currentNight(
    ctx.supabase,
    venueId,
    new Date(now.getTime() - OPEN_AFTER).toISOString(),
  )
  return night ? build(ctx, night, venue) : null
}

async function readNight(ctx: RequestContext, nightId: string): Promise<DoorView> {
  const night = await doorRepository.findNight(ctx.supabase, nightId)
  if (!night) throw notFound("That night does not exist, or you cannot see it.")
  return build(ctx, night, await venuesService.getDetail(ctx, night.venue_id))
}

// One arrival. A ticket scanned twice says when it was first used rather than counting the guests again.
async function checkIn(ctx: RequestContext, nightId: string, input: CheckinInput): Promise<CheckinResult> {
  const night = await doorRepository.findNight(ctx.supabase, nightId)
  if (!night) throw notFound("That night does not exist, or you cannot see it.")

  if ("walkIn" in input) {
    const { at, failure } = await doorRepository.addArrival(ctx.supabase, {
      event_night_id: night.id,
      venue_id: night.venue_id,
      party_size: input.partySize,
    })
    if (failure || !at) throw fromDatabaseError({ code: failure ?? undefined })
    return { status: "in", name: "Walk-in", partySize: input.partySize, at }
  }

  const code = "code" in input ? codeFrom(input.code) : null
  const rsvp =
    "code" in input
      ? code
        ? await doorRepository.rsvpByCode(ctx.supabase, code)
        : null
      : await doorRepository.rsvpById(ctx.supabase, input.rsvpId)
  if (!rsvp) throw notFound("No ticket with that code. Check the letters, or find the guest by name.")
  if (rsvp.event_night_id !== night.id) throw conflict("This ticket is for a different night.")

  const already = await doorRepository.arrivalOf(ctx.supabase, rsvp.id)
  if (already) return { status: "already", name: rsvp.guest_name, partySize: rsvp.party_size, at: already }
  const { at, failure } = await doorRepository.addArrival(ctx.supabase, {
    event_night_id: night.id,
    venue_id: night.venue_id,
    rsvp_id: rsvp.id,
    party_size: rsvp.party_size,
  })
  if (failure === "23505") {
    const first = await doorRepository.arrivalOf(ctx.supabase, rsvp.id)
    return {
      status: "already",
      name: rsvp.guest_name,
      partySize: rsvp.party_size,
      at: first ?? new Date().toISOString(),
    }
  }
  if (failure || !at) throw fromDatabaseError({ code: failure ?? undefined })
  return { status: "in", name: rsvp.guest_name, partySize: rsvp.party_size, at }
}

// A guest taps "I'm here" from the door's QR. Only around the night's start; the database holds the same window.
async function selfCheckIn(supabase: ServerSupabase, slug: string, partySize: number, now = new Date()) {
  const page = await readEventPage(supabase, slug, now)
  if (!page) throw notFound("This night does not exist.")
  if (page.status === "cancelled") throw conflict("This night has been cancelled.")
  const starts = new Date(page.startsAt).getTime()
  if (now.getTime() < starts - OPEN_BEFORE) throw conflict("Check-in opens an hour before the night starts.")
  if (now.getTime() > starts + OPEN_AFTER) throw conflict("This night has finished.")
  const failure = await doorRepository.addSelfArrival(supabase, {
    event_night_id: page.nightId,
    venue_id: page.venueId,
    party_size: partySize,
  })
  if (failure) throw fromDatabaseError({ code: failure })
  return { checkedIn: true }
}

// What the night took, as the owner tells it. Owners and managers only; RLS refuses door staff too.
async function logSpend(ctx: RequestContext, nightId: string, amount: number) {
  const night = await doorRepository.findNight(ctx.supabase, nightId)
  if (!night) throw notFound("That night does not exist, or you cannot see it.")
  await managedVenue(ctx, night.venue_id)
  await doorRepository.saveSpend(ctx.supabase, night.id, night.venue_id, toCents(amount))
  return { saved: true }
}

// When a team member opens a ticket (scanned with any phone camera), the guest it belongs to. RLS returns nothing
// for anyone else, and a signed-out guest may not read the guest list at all, so a guest never sees this.
async function ticketForStaff(supabase: ServerSupabase, nightId: string, code: string) {
  const rsvp = await doorRepository.rsvpByCode(supabase, code).catch((error: unknown) => {
    if (error instanceof AppError && error.code === "forbidden") return null
    throw error
  })
  if (!rsvp || rsvp.event_night_id !== nightId) return null
  return {
    nightId,
    name: rsvp.guest_name,
    partySize: rsvp.party_size,
    arrivedAt: await doorRepository.arrivalOf(supabase, rsvp.id),
  }
}

export const doorService = { readNight, checkIn, selfCheckIn, logSpend, ticketForStaff }
