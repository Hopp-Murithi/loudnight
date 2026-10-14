import "server-only"
import { townOf } from "@/lib/address"
import { notFound } from "@/lib/http/errors"
import { createAdminSupabase } from "@/lib/supabase/admin"
import type { RequestContext } from "@/modules/auth/types"
import { seriesRepository } from "@/modules/series/series.repository"
import type { TalentEditInput } from "@/modules/series/series.schemas"
import { openVenue } from "@/modules/venues/venues.access"
import { toCents } from "@/modules/venues/venues.schemas"
import { findTalent } from "./talent.find"
import { talentRepository } from "./talent.repository"

export { findTalent, type TalentNight, type TalentVenue } from "./talent.find"
export const talentService = {
  async find(ctx: RequestContext, seriesId: string): Promise<{ found: number }> {
    const series = await seriesRepository.findById(ctx.supabase, seriesId)
    const first = series?.event_nights.find((night) => night.sequence === 1)
    if (!series || !first) throw notFound("That series does not exist, or you cannot see it.")
    const venue = await openVenue(ctx, series.venue_id)
    const concept = await seriesRepository.findConcept(ctx.supabase, series.concept_id)
    if (!concept) throw notFound("The night behind this series is missing.")
    const found = await findTalent(
      createAdminSupabase(),
      {
        id: venue.id,
        name: venue.name,
        point: { latitude: Number(venue.latitude), longitude: Number(venue.longitude) },
        timeZone: venue.timeZone,
        talentBudgetCents: toCents(venue.settings.talentBudget),
        currency: venue.currency,
        countryCode: venue.countryCode,
        town: townOf(venue),
        hosts: venue.settings.hosts,
      },
      {
        conceptId: concept.id,
        conceptName: concept.name,
        format: concept.format,
        runId: concept.run_id,
        firstNight: first.starts_at,
      },
    )
    return { found }
  },

  // Reword the message, or mark the act as booked. Both go through the caller's own client, so RLS decides.
  async update(ctx: RequestContext, talentId: string, input: TalentEditInput): Promise<void> {
    const changes =
      "message" in input
        ? { outreach_edited: input.message }
        : { booked_at: input.booked ? new Date().toISOString() : null }
    if (!(await talentRepository.updateOwn(ctx.supabase, talentId, changes)))
      throw notFound("That performer is not on your shortlist, or you cannot change them.")
  },
}
