// Plans every demo venue (or the ones passed as arguments) with the real pipeline, replacing its previous plan.
import { createAdminSupabase } from "@/lib/supabase/admin"
import { listDemoVenueIds, precomputeDemoVenue } from "@/modules/demo/demo.service"

async function main() {
  const admin = createAdminSupabase()
  const asked = process.argv.slice(2)
  const venueIds = asked.length > 0 ? asked : await listDemoVenueIds(admin)
  let failed = 0
  for (const venueId of venueIds) {
    try {
      const summary = await precomputeDemoVenue(admin, venueId)
      console.log(`Ready: ${summary.name}, ${summary.concepts} nights, ${summary.seconds} s, run ${summary.runId}`)
    } catch (error) {
      failed += 1
      console.error(`Kept the previous plan for ${venueId}: ${error instanceof Error ? error.message : "failed"}`)
    }
  }
  process.exitCode = failed > 0 ? 1 : 0
}

void main()
