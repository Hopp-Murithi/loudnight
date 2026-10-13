// Runs steps 2 to 5 for a venue (plan 06) in a throwaway run and prints the shortlist with every receipt checked.
import { createAdminSupabase } from "@/lib/supabase/admin"
import { generateConcepts } from "@/modules/concepts/concepts.service"
import { findGap } from "@/modules/gap/gap.service"
import { readNeighbourhood } from "@/modules/taste/taste.service"
import { venueIdArg, withThrowawayRun } from "./lib/throwaway-run"

withThrowawayRun(venueIdArg(), async (venue, trace) => {
  const admin = createAdminSupabase()
  const started = Date.now()
  const area = { point: venue.point, radiusMetres: venue.radiusMetres }
  const [fingerprint, gap] = await Promise.all([readNeighbourhood(admin, area, trace), findGap(venue, trace)])
  const summary = await generateConcepts({
    admin,
    runId: trace.runId,
    venueId: venue.id,
    area,
    venue: venue.brief,
    fingerprint,
    gap,
    trace,
  })
  console.log(`${venue.name}: ${Date.now() - started} ms`, JSON.stringify(summary))

  const { data: concepts } = await admin
    .from("concepts")
    .select(
      "rank, is_shortlisted, name, pitch, total_score, audience_fit, novelty, venue_fit, cost_fit, evidence(claim, value, response_path, qloo_cache_id)",
    )
    .eq("run_id", trace.runId)
    .order("rank")
  for (const concept of concepts ?? []) {
    console.log(
      `\n#${concept.rank}${concept.is_shortlisted ? " *" : ""} ${concept.name} (${concept.total_score}: a ${concept.audience_fit} n ${concept.novelty} v ${concept.venue_fit} c ${concept.cost_fit})`,
    )
    console.log(`   ${concept.pitch}`)
    for (const item of concept.evidence) {
      const { data: cache } = await admin.from("qloo_cache").select("response").eq("id", item.qloo_cache_id).single()
      const stored = item.response_path.reduce<unknown>(
        (node, key) => (node as Record<string, unknown>)?.[key],
        cache?.response,
      )
      console.log(
        `   - ${item.claim} [${item.value}] receipt ${stored === Number(item.value) ? "matches" : `MISMATCH ${String(stored)}`}`,
      )
    }
  }
}).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
