import "server-only"
import { townOf } from "@/lib/address"
import { notFound } from "@/lib/http/errors"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { Json } from "@/types/database"
import type { RequestContext } from "@/modules/auth/types"
import { seriesRepository } from "@/modules/series/series.repository"
import { readSeries } from "@/modules/series/series.service"
import { readTalent } from "@/modules/talent/talent.read"
import { managedVenue } from "@/modules/venues/venues.access"
import { promoteRepository } from "./promote.repository"
import { readDesign, type AdDesign, type PromoBoard } from "./promote.schemas"

interface PromoVenue {
  id: string
  name: string
  address: string
  city: string | null
  timeZone: string
}

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}

// Everything the ad studio draws from, for the chosen night. Null until that night has its four weeks.
export async function readPromoBoard(
  supabase: ServerSupabase,
  venue: PromoVenue,
  conceptId: string,
): Promise<PromoBoard | null> {
  const [concept, series, acts] = await Promise.all([
    seriesRepository.findConcept(supabase, conceptId),
    readSeries(supabase, conceptId, venue.timeZone),
    readTalent(supabase, conceptId),
  ])
  if (!concept || !series) return null
  const assets = new Map(
    (await promoteRepository.nightAssets(supabase, series.id)).map((row) => [row.id, asObject(row.assets)]),
  )
  const booked = [...acts.talent, ...acts.references]
    .filter((act) => act.bookedAt !== null)
    .sort((a, b) => (a.bookedAt ?? "").localeCompare(b.bookedAt ?? ""))
  return {
    venue: { id: venue.id, name: venue.name, city: townOf(venue), timeZone: venue.timeZone },
    night: { name: concept.name, format: concept.format, themes: concept.themes },
    nights: series.nights.map((night) => ({ ...night, design: readDesign(assets.get(night.id)?.ad) })),
    acts: booked.map((act) => ({ name: act.name, imageUrl: act.profile.imageUrl })),
  }
}

// One named entry in a night's assets, saved without touching the others. Owners and managers only.
export async function saveNightAsset(ctx: RequestContext, nightId: string, key: string, value: unknown): Promise<void> {
  const night = await promoteRepository.findNight(ctx.supabase, nightId)
  if (!night) throw notFound("That night does not exist, or you cannot see it.")
  await managedVenue(ctx, night.venue_id)
  const assets = { ...asObject(night.assets), [key]: value } as unknown as Json
  if (!(await promoteRepository.saveAssets(ctx.supabase, nightId, assets)))
    throw notFound("That night does not exist, or you cannot change it.")
}

export const promoteService = {
  // The design is kept beside the night's other assets, so the event page can show the same poster.
  saveDesign: (ctx: RequestContext, nightId: string, design: AdDesign) => saveNightAsset(ctx, nightId, "ad", design),
}
