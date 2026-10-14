import type { Enums } from "@/types/database"

export type PipelineStep = Enums<"pipeline_step">
export type ToolSource = "Qloo" | "Google Places" | "Ticketmaster" | "Claude" | "Loudnight"

// The fixed spine of a run. Claude chooses tools inside a step, never the order of steps.
export const PIPELINE: { step: PipelineStep; label: string; what: string }[] = [
  { step: "scout", label: "Scouting the venue", what: "Your venue as Google sees it" },
  {
    step: "read_neighbourhood",
    label: "Reading the neighbourhood",
    what: "What people within walking distance love, from Qloo",
  },
  { step: "find_gap", label: "Checking what is on nearby", what: "What nearby venues already run that night" },
  { step: "generate_concepts", label: "Inventing nights", what: "Six nights nobody nearby runs, each pairing checked" },
  {
    step: "score",
    label: "Scoring and checking every receipt",
    what: "Every claim checked against its receipt, then scored",
  },
  { step: "plan", label: "Getting the shortlist ready", what: "The three best, ready to compare" },
]

export const PIPELINE_STEPS = PIPELINE.map((entry) => entry.step)

export const TOOL_SOURCES: Record<string, ToolSource> = {
  "qloo.insights": "Qloo",
  "qloo.overlap": "Qloo",
  "places.details": "Google Places",
  "places.nearby": "Google Places",
  "ticketmaster.events": "Ticketmaster",
  "planner.themes": "Claude",
  "planner.concepts": "Claude",
  "encore.score": "Loudnight",
}

// The longest step (inventing nights) takes about a minute; the route allows twice that.
export const STEP_MAX_SECONDS = 120
