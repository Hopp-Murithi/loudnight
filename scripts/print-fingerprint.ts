// Prints a venue's fingerprint (plan 04) inside a throwaway run, counts its trace rows, then deletes the run.
import { createAdminSupabase } from "@/lib/supabase/admin"
import { readNeighbourhood } from "@/modules/taste/taste.service"

async function main() {
  const venueId = process.argv[2]
  if (!venueId) throw new Error("Usage: npm run taste:print -- <venueId>")
  const admin = createAdminSupabase()

  const { data: venue, error } = await admin
    .from("venues")
    .select("name, latitude, longitude, venue_settings(search_radius_m, slow_night)")
    .eq("id", venueId)
    .single()
  if (error || !venue) throw new Error(`Venue ${venueId} not found`)
  const settings = Array.isArray(venue.venue_settings) ? venue.venue_settings[0] : venue.venue_settings
  const radiusMetres = settings?.search_radius_m ?? 2000

  const { data: run, error: runError } = await admin
    .from("agent_runs")
    .insert({ venue_id: venueId, target_weekday: settings?.slow_night ?? "tuesday", status: "running" })
    .select("id")
    .single()
  if (runError || !run) throw new Error(`Could not open a run: ${runError?.message}`)

  const started = Date.now()
  try {
    const fingerprint = await readNeighbourhood(
      admin,
      { point: { latitude: Number(venue.latitude), longitude: Number(venue.longitude) }, radiusMetres },
      { admin, runId: run.id, venueId, step: "read_neighbourhood" },
    )
    console.log(`${venue.name}, radius ${radiusMetres} m, ${Date.now() - started} ms\n`)
    for (const domain of fingerprint.domains) {
      const top = domain.items.slice(0, 3).map((item) => `${item.name} (${item.affinity.toFixed(2)})`)
      console.log(`${domain.status.padEnd(6)} ${domain.label.padEnd(20)} ${top.join(", ")}`)
    }
    const withResults = fingerprint.domains.filter((domain) => domain.status === "ok").length
    console.log(`\n${withResults} of ${fingerprint.domains.length} domains have results`)
    if (fingerprint.audience) {
      const lean = fingerprint.audience.age.map((band) => `${band.label} ${band.value.toFixed(2)}`)
      console.log(`Audience of ${fingerprint.audience.basedOn.map((tag) => tag.name).join(", ")}: ${lean.join(", ")}`)
    }

    const { data: steps } = await admin
      .from("run_steps")
      .select("status, qloo_cache_id, latency_ms, output_summary")
      .eq("run_id", run.id)
    const cached = (steps ?? []).filter((step) => (step.output_summary as { fromCache?: boolean }).fromCache).length
    const traced = (steps ?? []).filter((step) => step.qloo_cache_id && step.latency_ms !== null).length
    console.log(
      `Trace: ${steps?.length ?? 0} steps, ${traced} with a cache id and latency, ${cached} answered from cache`,
    )
  } finally {
    await admin.from("agent_runs").delete().eq("id", run.id)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
