// Prints a venue's scout summary and competitor gap scan (plan 05) inside a throwaway run.
import { formatDistance } from "@/lib/geo"
import { findGap, scoutVenue } from "@/modules/gap/gap.service"
import { venueIdArg, withThrowawayRun } from "./lib/throwaway-run"

withThrowawayRun(venueIdArg(), async (venue, trace) => {
  const started = Date.now()
  const scout = await scoutVenue(venue.placeId, trace)
  const scan = await findGap(venue, trace)
  console.log(`${venue.name}, ${venue.weekday}s, ${venue.radiusMetres} m, ${Date.now() - started} ms`)
  console.log(
    scout
      ? `Scout: ${scout.type}, ${scout.rating} (${scout.ratingCount}), ${scout.hours[2] ?? "no hours"}`
      : "Scout: none",
  )
  console.log(`Sources: ${JSON.stringify(scan.sources)}, neutral novelty: ${scan.noveltyNeutral}`)
  console.log(`Nights: ${scan.nights.join(", ")}`)
  console.log(
    `Venues (${scan.venues.length}): ${scan.venues
      .slice(0, 6)
      .map((v) => `${v.name} [${v.type}, ${v.distanceMetres === null ? "?" : formatDistance(v.distanceMetres)}]`)
      .join(", ")}`,
  )
  console.log(
    `Events (${scan.events.length}): ${scan.events
      .slice(0, 5)
      .map((e) => `${e.name} (${e.localDate}, ${e.genre})`)
      .join("; ")}`,
  )
  console.log(`Themes: ${scan.themes.map((t) => `${t.theme} ${t.count}`).join(", ")}`)
}).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
