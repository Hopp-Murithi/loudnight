import "server-only"
import { cityOf } from "@/lib/address"
import type { ServerSupabase } from "@/lib/supabase/server"
import { eventsRepository } from "./events.repository"
import type { EventPageView } from "./events.schemas"

// A night counts as over six hours after it starts.
const OVER_AFTER_MS = 6 * 3_600_000

// A guest's view of one night, read with the guest's own client: only published or cancelled nights exist for them.
export async function readEventPage(
  supabase: ServerSupabase,
  slug: string,
  now = new Date(),
): Promise<EventPageView | null> {
  const night = await eventsRepository.findPublicNight(supabase, slug)
  if (!night || (night.status !== "published" && night.status !== "cancelled")) return null
  const venue = await eventsRepository.findPublicVenue(supabase, night.venue_id)
  if (!venue) return null
  const past = new Date(night.starts_at).getTime() + OVER_AFTER_MS < now.getTime()
  const nextSlug = past ? await eventsRepository.nextPublishedNight(supabase, night.series_id, now.toISOString()) : null
  return {
    nightId: night.id,
    venueId: night.venue_id,
    slug: night.public_slug,
    sequence: night.sequence,
    title: night.title ?? venue.name,
    blurb: night.blurb,
    twist: night.variation,
    lineup: night.lineup,
    startsAt: night.starts_at,
    status: night.status,
    past,
    nextSlug,
    paused: venue.suspended_at !== null,
    venue: {
      name: venue.name,
      address: venue.address,
      town: venue.city ?? cityOf(venue.address),
      timeZone: venue.time_zone,
      latitude: Number(venue.latitude),
      longitude: Number(venue.longitude),
    },
  }
}
