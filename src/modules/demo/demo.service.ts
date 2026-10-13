import "server-only"
import { PIPELINE_STEPS } from "@/config/runs"
import { forbidden, notFound, upstreamFailed } from "@/lib/http/errors"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"
import { listShortlist } from "@/modules/concepts/concepts.read"
import { runAndStoreStep, storeGenericAnswer } from "@/modules/runs/runs.execute"
import type { RunVenue } from "@/modules/runs/runs.pipeline"
import { readRun } from "@/modules/runs/runs.read"
import { runsRepository } from "@/modules/runs/runs.repository"
import type { RunContext } from "@/modules/runs/runs.schemas"
import { demoRepository } from "./demo.repository"
import type { DemoPlan, PrecomputeSummary } from "./demo.schemas"

type UpkeepVenue = NonNullable<Awaited<ReturnType<typeof demoRepository.venueForUpkeep>>>

const one = <T>(value: T | T[] | null): T | null => (Array.isArray(value) ? (value[0] ?? null) : value)

function toRunVenue(venue: UpkeepVenue): RunVenue {
  const settings = one(venue.venue_settings)
  if (!settings) throw forbidden("This demo venue has no settings to plan from.")
  return {
    id: venue.id,
    placeId: venue.google_place_id,
    point: { latitude: Number(venue.latitude), longitude: Number(venue.longitude) },
    radiusMetres: settings.search_radius_m,
    timeZone: venue.time_zone,
    weekday: settings.slow_night,
    brief: {
      type: venue.venue_type,
      slowNight: settings.slow_night,
      capacity: settings.capacity,
      capabilities: settings.capabilities,
      talentBudgetCents: settings.talent_budget_cents,
      averageSpendCents: settings.average_spend_cents,
    },
  }
}

// A judge's view of a demo venue: the newest finished plan, read with their own client so RLS decides.
export async function readDemoPlan(supabase: ServerSupabase, venueId: string): Promise<DemoPlan> {
  const row = await demoRepository.findVenue(supabase, venueId)
  const settings = row ? one(row.venue_settings) : null
  if (!row || !settings) throw notFound("That demo venue does not exist.")
  const venue = {
    id: row.id,
    name: row.name,
    address: row.address,
    venueType: row.venue_type,
    timeZone: row.time_zone,
    slowNight: settings.slow_night,
    breakEvenHeadcount: settings.break_even_headcount,
    capacity: settings.capacity,
    radiusMetres: settings.search_radius_m,
  }
  const plan = await demoRepository.latestPlan(supabase, venueId)
  if (!plan) return { venue, run: null, concepts: [] }
  const [run, concepts] = await Promise.all([readRun(supabase, plan.id), listShortlist(supabase, plan.id)])
  return { venue, run, concepts }
}

export const listDemoVenueIds = (admin: AdminSupabase) => demoRepository.listDemoIds(admin)

// Demo upkeep: the real six steps, with nobody asking. The previous plan is replaced only once the new one is whole.
export async function precomputeDemoVenue(admin: AdminSupabase, venueId: string): Promise<PrecomputeSummary> {
  const row = await demoRepository.venueForUpkeep(admin, venueId)
  if (!row?.is_demo) throw forbidden("Only demo venues are planned ahead of time.")
  const venue = toRunVenue(row)
  const started = Date.now()
  const previous = await demoRepository.runIdsFor(admin, venueId)
  const { encoreId, genericId } = await runsRepository.createPair(admin, venueId, null, venue.weekday)

  let context: RunContext = {}
  try {
    for (const [index, step] of PIPELINE_STEPS.entries()) {
      if (!(await runsRepository.claimStep(admin, encoreId, step, index === 0))) throw upstreamFailed("the planner")
      const stored = await runAndStoreStep({ admin, runId: encoreId, venueId, step }, venue, context)
      context = stored.context
    }
    await storeGenericAnswer(admin, genericId, {
      name: row.name,
      venueType: row.venue_type,
      address: row.address,
      weekday: venue.weekday,
    })
    const top = await demoRepository.topConceptId(admin, encoreId)
    if (!top) throw upstreamFailed("the planner")
    await demoRepository.markChosen(admin, top)
  } catch (error) {
    await demoRepository.deleteRuns(admin, [encoreId])
    throw error
  }

  await demoRepository.deleteRuns(admin, previous)
  return {
    venueId,
    name: row.name,
    runId: encoreId,
    concepts: context.summary?.shortlisted ?? 0,
    seconds: Math.round((Date.now() - started) / 1000),
  }
}
