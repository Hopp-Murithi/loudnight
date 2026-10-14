import "server-only"
import { conflict, notFound } from "@/lib/http/errors"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { RequestContext } from "@/modules/auth/types"
import type { Weekday } from "@/modules/gap/gap.weekdays"
import { managedVenue } from "@/modules/venues/venues.access"
import { instantFor, localParts, nightSlug, seriesNights } from "./series.dates"
import { seriesRepository } from "./series.repository"
import type { NightEditInput, SeriesView } from "./series.schemas"
import { writeVariations } from "./series.variations"

export interface SeriesVenue {
  timeZone: string
  capabilities: string[]
}

type ChosenConcept = NonNullable<Awaited<ReturnType<typeof seriesRepository.findConcept>>>

async function chosenConcept(supabase: ServerSupabase | AdminSupabase, conceptId: string): Promise<ChosenConcept> {
  const concept = await seriesRepository.findConcept(supabase, conceptId)
  if (!concept) throw notFound("That night does not exist, or you cannot see it.")
  if (!concept.chosen_at) throw conflict("Choose this night first, then make it a series.")
  return concept
}

// Four weekly nights from next week, each with its own twist. The database makes all five rows or none.
export async function createSeries(
  supabase: ServerSupabase | AdminSupabase,
  venue: SeriesVenue,
  concept: ChosenConcept,
  now: Date = new Date(),
): Promise<string> {
  const weekday = (await seriesRepository.runWeekday(supabase, concept.run_id)) as Weekday | null
  if (!weekday) throw notFound("The plan behind this night is missing.")
  const nights = seriesNights(weekday, venue.timeZone, now)
  const variations = await writeVariations({
    name: concept.name,
    pitch: concept.pitch,
    format: concept.format,
    themes: concept.themes,
    capabilities: venue.capabilities,
  })
  return seriesRepository.create(
    supabase,
    concept.id,
    nights[0].localDate,
    nights.map((night, index) => ({
      starts_at: night.startsAt.toISOString(),
      variation: variations[index],
      slug: nightSlug(concept.name, night.localDate, concept.id),
    })),
  )
}

// The chosen night's series as the caller may see it, with each night's date and time on the venue's own clock.
export async function readSeries(
  supabase: ServerSupabase | AdminSupabase,
  conceptId: string,
  timeZone: string,
): Promise<SeriesView | null> {
  const row = await seriesRepository.findByConcept(supabase, conceptId)
  if (!row) return null
  return {
    id: row.id,
    conceptId: row.concept_id,
    status: row.status,
    nights: [...row.event_nights]
      .sort((a, b) => a.sequence - b.sequence)
      .map((night) => {
        const local = localParts(night.starts_at, timeZone)
        return {
          id: night.id,
          sequence: night.sequence,
          startsAt: night.starts_at,
          localDate: local.date,
          localTime: local.time,
          variation: night.variation,
          status: night.status,
          slug: night.public_slug,
        }
      }),
  }
}

export const seriesService = {
  async create(ctx: RequestContext, conceptId: string): Promise<{ seriesId: string }> {
    const concept = await chosenConcept(ctx.supabase, conceptId)
    const venue = await managedVenue(ctx, concept.venue_id)
    if (await seriesRepository.findByConcept(ctx.supabase, concept.id))
      throw conflict("This night already has its four weeks.")
    const seriesId = await createSeries(
      ctx.supabase,
      { timeZone: venue.timeZone, capabilities: venue.settings.capabilities },
      concept,
    )
    return { seriesId }
  },

  async updateNight(ctx: RequestContext, nightId: string, input: NightEditInput): Promise<void> {
    const night = await seriesRepository.findNight(ctx.supabase, nightId)
    if (!night) throw notFound("That night does not exist, or you cannot see it.")
    const venue = await managedVenue(ctx, night.venue_id)
    if (night.status !== "draft") throw conflict("This night is already published. Change it from its event page.")
    const saved = await seriesRepository.updateDraftNight(ctx.supabase, nightId, {
      starts_at: instantFor(input.date, input.time, venue.timeZone).toISOString(),
      variation: input.variation,
    })
    if (!saved) throw conflict("This night changed while you were editing. Reload and try again.")
  },
}
