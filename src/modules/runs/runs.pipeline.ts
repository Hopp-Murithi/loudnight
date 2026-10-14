import "server-only"
import { WEEKDAY_LABELS, type Weekday } from "@/config/venues"
import { conflict } from "@/lib/http/errors"
import { formatDistance, type LatLng } from "@/lib/geo"
import type { VenueBrief } from "@/modules/concepts/concepts.prompt"
import { inventConcepts, scoreConcepts, type PlanningInput } from "@/modules/concepts/concepts.service"
import { findGap, scoutVenue } from "@/modules/gap/gap.service"
import { readNeighbourhood } from "@/modules/taste/taste.service"
import type { PipelineStep } from "@/config/runs"
import type { RunContext } from "./runs.schemas"
import { atStep, type StepContext } from "./runs.steps"

export interface RunVenue {
  id: string
  placeId: string | null
  point: LatLng
  radiusMetres: number
  timeZone: string
  weekday: Weekday
  brief: VenueBrief
}

export interface StepResult {
  patch: Partial<RunContext>
  findings: string[]
}

const listOf = (names: string[]) => names.slice(0, 3).join(", ")

function planningInput(venue: RunVenue, context: RunContext, trace: StepContext): PlanningInput {
  if (!context.fingerprint || !context.gap) throw conflict("Read the neighbourhood and check what is on nearby first.")
  return {
    admin: trace.admin,
    runId: trace.runId,
    venueId: venue.id,
    area: { point: venue.point, radiusMetres: venue.radiusMetres },
    venue: venue.brief,
    fingerprint: context.fingerprint,
    gap: context.gap,
    trace,
  }
}

// One pipeline step. Each returns what the next steps need and a few plain findings for the trace.
export async function executeStep(
  step: PipelineStep,
  venue: RunVenue,
  context: RunContext,
  trace: StepContext,
): Promise<StepResult> {
  const night = `${WEEKDAY_LABELS[venue.weekday]}s`
  switch (step) {
    case "scout": {
      const scout = await scoutVenue(venue.placeId, trace)
      const rated = scout?.rating ? `, rated ${scout.rating.toFixed(1)} from ${scout.ratingCount ?? 0} reviews` : ""
      return {
        patch: { scout },
        findings: [
          scout
            ? `${scout.type ?? "Venue"}${rated}`
            : "No Google listing linked, so Loudnight works from your address.",
        ],
      }
    }
    case "read_neighbourhood": {
      const area = { point: venue.point, radiusMetres: venue.radiusMetres }
      const fingerprint = await readNeighbourhood(trace.admin, area, atStep(trace, "read_neighbourhood"))
      const names = (id: string) =>
        fingerprint.domains.find((domain) => domain.domain === id)?.items.map((item) => item.name) ?? []
      const read = fingerprint.domains.filter((domain) => domain.status === "ok").length
      return {
        patch: { fingerprint },
        findings: [
          `${read} of ${fingerprint.domains.length} areas of taste read from Qloo`,
          `Music people love here: ${listOf(names("music_styles"))}`,
          `Nights out they like: ${listOf(names("place_styles"))}`,
        ],
      }
    }
    case "find_gap": {
      const gap = await findGap(venue, trace)
      const busiest = [...gap.themes].sort((a, b) => b.count - a.count).map((theme) => theme.theme)
      return {
        patch: { gap },
        findings: [
          `${gap.venues.length} venues and ${gap.events.length} ticketed events within ${formatDistance(venue.radiusMetres)} on ${night}`,
          busiest.length > 0 ? `Already covered: ${listOf(busiest)}` : `Nothing covered on ${night} nearby yet`,
        ],
      }
    }
    case "generate_concepts": {
      const invention = await inventConcepts(planningInput(venue, context, trace))
      const confirmed = invention.overlaps.filter((overlap) => overlap.found).length
      return {
        patch: { invention },
        findings: [
          `${invention.candidates.length} nights invented`,
          `${invention.overlaps.length} pairings checked with Qloo, ${confirmed} confirmed`,
        ],
      }
    }
    case "score": {
      if (!context.invention) throw conflict("Invent the nights first.")
      const summary = await scoreConcepts(planningInput(venue, context, trace), context.invention)
      const dropped = summary.dropped.length
      return {
        patch: { summary },
        findings: [
          `${summary.stored} of ${summary.candidates} nights passed the evidence check`,
          dropped > 0 ? `${dropped} claims dropped for having no receipt` : "Every claim has a receipt",
        ],
      }
    }
    case "plan":
      return { patch: {}, findings: [`Your ${context.summary?.shortlisted ?? 3} best nights are ready to compare`] }
  }
}
