import "server-only"
import { townOf } from "@/lib/address"
import { PIPELINE_STEPS } from "@/config/runs"
import { forbidden, notFound, upstreamFailed } from "@/lib/http/errors"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"
import { listShortlist } from "@/modules/concepts/concepts.read"
import { runAndStoreStep, storeGenericAnswer } from "@/modules/runs/runs.execute"
import type { RunVenue } from "@/modules/runs/runs.pipeline"
import { readRun } from "@/modules/runs/runs.read"
import { runsRepository } from "@/modules/runs/runs.repository"
import { seriesRepository } from "@/modules/series/series.repository"
import { createSeries, readSeries } from "@/modules/series/series.service"
import { readTalent } from "@/modules/talent/talent.read"
import { findTalent } from "@/modules/talent/talent.service"
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
      currency: venue.currency,
      town: townOf(venue),
      hosts: settings.hosts,
      atmosphere: settings.atmosphere,
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
    city: row.city,
    currency: row.currency,
    venueType: row.venue_type,
    timeZone: row.time_zone,
    slowNight: settings.slow_night,
    breakEvenHeadcount: settings.break_even_headcount,
    capacity: settings.capacity,
    radiusMetres: settings.search_radius_m,
  }
  const plan = await demoRepository.latestPlan(supabase, venueId)
  const nothing = { series: null, talent: [], references: [] }
  if (!plan) return { venue, run: null, concepts: [], ...nothing }
  const [run, concepts] = await Promise.all([readRun(supabase, plan.id), listShortlist(supabase, plan.id)])
  const chosen = concepts.find((concept) => concept.chosen)
  if (!chosen) return { venue, run, concepts, ...nothing }
  const [series, acts] = await Promise.all([
    readSeries(supabase, chosen.id, venue.timeZone),
    readTalent(supabase, chosen.id),
  ])
  return { venue, run, concepts, series, ...acts }
}

// The rest of the journey for the chosen night: its four weeks, then who could play them.
async function planTheNights(admin: AdminSupabase, row: UpkeepVenue, venue: RunVenue, conceptId: string) {
  const concept = await seriesRepository.findConcept(admin, conceptId)
  if (!concept) throw upstreamFailed("the planner")
  await createSeries(admin, { timeZone: venue.timeZone, capabilities: venue.brief.capabilities }, concept)
  const first = (await readSeries(admin, conceptId, venue.timeZone))?.nights[0]
  if (!first) throw upstreamFailed("the planner")
  return findTalent(
    admin,
    {
      id: row.id,
      name: row.name,
      point: venue.point,
      timeZone: venue.timeZone,
      talentBudgetCents: venue.brief.talentBudgetCents,
      currency: venue.brief.currency,
      countryCode: row.country_code,
    },
    {
      conceptId,
      conceptName: concept.name,
      format: concept.format,
      runId: concept.run_id,
      firstNight: first.startsAt,
    },
  )
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
  let performers = 0
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
    performers = await planTheNights(admin, row, venue, top)
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
    performers,
    seconds: Math.round((Date.now() - started) / 1000),
  }
}
