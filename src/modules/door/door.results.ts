import "server-only"
import { forbidden } from "@/lib/http/errors"
import type { RequestContext } from "@/modules/auth/types"
import { toCents } from "@/modules/venues/venues.schemas"
import { venuesService } from "@/modules/venues/venues.service"
import { nightNumbers, type NightNumbers } from "./door.metrics"
import { doorRepository } from "./door.repository"

export interface NightResult {
  id: string
  slug: string
  title: string
  startsAt: string
  status: string
  numbers: NightNumbers
}

export interface ResultsView {
  currency: string
  breakEven: number
  averageSpendCents: number
  nights: NightResult[]
}

// Every published night's turnout and takings, newest first. Money: owners and managers only.
export async function readResults(ctx: RequestContext, venueId: string): Promise<ResultsView> {
  const venue = await venuesService.getDetail(ctx, venueId)
  if (!venue.settings) throw forbidden("Results are for the venue's owner and managers.")
  const settings = venue.settings
  const nights = await doorRepository.publicNights(ctx.supabase, venueId)
  const { rsvps, arrivals, spend } = await doorRepository.attendanceFor(
    ctx.supabase,
    nights.map((night) => night.id),
  )
  const spent = new Map(spend.map((row) => [row.event_night_id, row.spend_cents]))
  return {
    currency: venue.currency,
    breakEven: settings.breakEvenHeadcount,
    averageSpendCents: toCents(settings.averageSpend),
    nights: nights.map((night) => ({
      id: night.id,
      slug: night.public_slug,
      title: night.title ?? venue.name,
      startsAt: night.starts_at,
      status: night.status,
      numbers: nightNumbers({
        guests: rsvps
          .filter((row) => row.event_night_id === night.id)
          .map((row) => ({ id: row.id, partySize: row.party_size })),
        arrivals: arrivals
          .filter((row) => row.event_night_id === night.id)
          .map((row) => ({ rsvpId: row.rsvp_id, partySize: row.party_size })),
        breakEven: settings.breakEvenHeadcount,
        averageSpendCents: toCents(settings.averageSpend),
        loggedSpendCents: spent.get(night.id) ?? null,
      }),
    })),
  }
}
