// Loads a venue and runs pipeline steps inside a run that is deleted afterwards (KEEP_RUN=1 keeps it).
import { createAdminSupabase, type AdminSupabase } from "@/lib/supabase/admin"
import type { StepContext } from "@/modules/runs/runs.steps"
import type { Weekday } from "@/modules/gap/gap.weekdays"
import type { VenueBrief } from "@/modules/concepts/concepts.prompt"

export interface ScriptVenue {
  id: string
  name: string
  placeId: string | null
  point: { latitude: number; longitude: number }
  radiusMetres: number
  timeZone: string
  weekday: Weekday
  brief: VenueBrief
}

async function loadVenue(admin: AdminSupabase, venueId: string): Promise<ScriptVenue> {
  const { data, error } = await admin
    .from("venues")
    .select(
      "id, name, city, currency, venue_type, google_place_id, latitude, longitude, time_zone, venue_settings(search_radius_m, slow_night, capacity, capabilities, talent_budget_cents, average_spend_cents)",
    )
    .eq("id", venueId)
    .single()
  if (error || !data) throw new Error(`Venue ${venueId} not found`)
  const settings = Array.isArray(data.venue_settings) ? data.venue_settings[0] : data.venue_settings
  return {
    id: data.id,
    name: data.name,
    placeId: data.google_place_id,
    point: { latitude: Number(data.latitude), longitude: Number(data.longitude) },
    radiusMetres: settings?.search_radius_m ?? 2000,
    timeZone: data.time_zone,
    weekday: settings?.slow_night ?? "tuesday",
    brief: {
      type: data.venue_type,
      slowNight: settings?.slow_night ?? "tuesday",
      capacity: settings?.capacity ?? 60,
      capabilities: settings?.capabilities ?? [],
      talentBudgetCents: settings?.talent_budget_cents ?? 0,
      averageSpendCents: settings?.average_spend_cents ?? 0,
      currency: data.currency,
      town: data.city,
      hosts: [],
      atmosphere: "mixed",
    },
  }
}

export async function withThrowawayRun(
  venueId: string,
  work: (venue: ScriptVenue, trace: StepContext) => Promise<void>,
): Promise<void> {
  const admin = createAdminSupabase()
  const venue = await loadVenue(admin, venueId)
  const { data: run, error } = await admin
    .from("agent_runs")
    .insert({ venue_id: venue.id, target_weekday: venue.weekday, status: "running" })
    .select("id")
    .single()
  if (error || !run) throw new Error(`Could not open a run: ${error?.message}`)
  try {
    await work(venue, { admin, runId: run.id, venueId: venue.id, step: "read_neighbourhood" })
    const { data: steps } = await admin.from("run_steps").select("step, tool, status, latency_ms").eq("run_id", run.id)
    const lines = (steps ?? []).map((step) => `${step.step}/${step.tool} ${step.status} ${step.latency_ms ?? "?"} ms`)
    console.log(`\nTrace (${lines.length} steps):\n  ${lines.join("\n  ")}`)
  } finally {
    if (process.env.KEEP_RUN === "1") console.log(`Kept run ${run.id}`)
    else await admin.from("agent_runs").delete().eq("id", run.id)
  }
}

export const venueIdArg = () => {
  const venueId = process.argv[2]
  if (!venueId) throw new Error("Pass a venue id")
  return venueId
}
