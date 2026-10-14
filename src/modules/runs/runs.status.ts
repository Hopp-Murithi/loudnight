import "server-only"
import type { Weekday } from "@/config/venues"
import type { ServerSupabase } from "@/lib/supabase/server"
import { runsRepository } from "./runs.repository"
import type { RunStatus } from "./runs.schemas"

export interface PlanNight {
  id: string
  name: string
  total: number
}

export interface VenuePlanStatus {
  runId: string | null
  status: RunStatus | "none"
  plannedAt: string | null
  shortlist: PlanNight[]
  chosen: PlanNight | null
}

const NONE: VenuePlanStatus = { runId: null, status: "none", plannedAt: null, shortlist: [], chosen: null }

// Where each venue stands with planning (for one quiet night when given), in two queries however many venues there are. RLS scopes both.
export async function planStatuses(
  supabase: ServerSupabase,
  venueIds: string[],
  weekday?: Weekday,
): Promise<Record<string, VenuePlanStatus>> {
  const runs = await runsRepository.latestRunsFor(supabase, venueIds, weekday)
  const latest = new Map<string, (typeof runs)[number]>()
  runs.forEach((run) => {
    if (!latest.has(run.venue_id)) latest.set(run.venue_id, run)
  })
  const concepts = await runsRepository.shortlistsFor(
    supabase,
    [...latest.values()].map((run) => run.id),
  )

  return Object.fromEntries(
    venueIds.map((venueId) => {
      const run = latest.get(venueId)
      if (!run) return [venueId, NONE]
      const mine = concepts.filter((concept) => concept.run_id === run.id)
      const toNight = (concept: (typeof mine)[number]): PlanNight => ({
        id: concept.id,
        name: concept.name,
        total: concept.total_score ?? 0,
      })
      const chosen = mine.find((concept) => concept.chosen_at !== null)
      return [
        venueId,
        {
          runId: run.id,
          status: run.status as RunStatus,
          plannedAt: run.created_at,
          shortlist: mine.map(toNight),
          chosen: chosen ? toNight(chosen) : null,
        },
      ]
    }),
  )
}
