import "server-only"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { RequestContext } from "@/modules/auth/types"
import { promoteRepository } from "@/modules/promote/promote.repository"
import { saveNightAsset } from "@/modules/promote/promote.service"
import { seriesRepository } from "@/modules/series/series.repository"
import { readSeries } from "@/modules/series/series.service"
import { readTalent } from "@/modules/talent/talent.read"
import type { VenueDetail } from "@/modules/venues/venues.schemas"
import { toCents } from "@/modules/venues/venues.schemas"
import { buildReadiness, type ChecklistInput, type Readiness } from "./readiness.build"

export interface ReadinessView extends Readiness {
  // The night the logistics belong to: the next one coming, or the first when all are past.
  night: { id: string; localDate: string } | null
}

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}

// Where the chosen night stands, read from what already exists. Null when the caller cannot see the night.
export async function readReadiness(
  supabase: ServerSupabase,
  venue: VenueDetail & { settings: NonNullable<VenueDetail["settings"]> },
  conceptId: string,
  now: Date = new Date(),
): Promise<ReadinessView | null> {
  const [concept, series, acts] = await Promise.all([
    seriesRepository.findConcept(supabase, conceptId),
    readSeries(supabase, conceptId, venue.timeZone),
    readTalent(supabase, conceptId),
  ])
  if (!concept) return null
  const rows = series ? await promoteRepository.nightAssets(supabase, series.id) : []
  const assets = new Map(rows.map((row) => [row.id, asObject(row.assets)]))
  const next = series?.nights.find((night) => new Date(night.startsAt) >= now) ?? series?.nights[0] ?? null
  const ticked = asObject(next ? assets.get(next.id)?.checklist : null).done

  return {
    ...buildReadiness({
      venueId: venue.id,
      conceptName: concept.name,
      needs: concept.needs,
      capabilities: venue.settings.capabilities,
      costCents: concept.estimated_cost_cents,
      budgetCents: toCents(venue.settings.talentBudget),
      currency: venue.currency,
      hasSeries: series !== null,
      bookedCount: acts.talent.filter((act) => act.booked).length,
      shortlistCount: acts.talent.length,
      adSaved: [...assets.values()].some((entry) => entry.ad !== undefined),
      logisticsDone: Array.isArray(ticked) ? ticked.filter((item) => typeof item === "string") : [],
    }),
    night: next ? { id: next.id, localDate: next.localDate } : null,
  }
}

export const readinessService = {
  saveChecklist: (ctx: RequestContext, nightId: string, input: ChecklistInput) =>
    saveNightAsset(ctx, nightId, "checklist", { done: [...new Set(input.done)] }),
}
