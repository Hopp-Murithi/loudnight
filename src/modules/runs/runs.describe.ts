import { TOOL_SOURCES } from "@/config/runs"
import { TASTE_DOMAINS } from "@/config/taste"
import type { ToolLine } from "./runs.schemas"

type JsonObject = Record<string, unknown>

const text = (value: unknown) => (typeof value === "string" ? value : "")

// One plain sentence per tool call, the same live and on replay, so a reload reads exactly like the first time.
export function describeTool(tool: string, input: JsonObject, summary: JsonObject): string {
  switch (tool) {
    case "qloo.insights": {
      const domain = TASTE_DOMAINS.find((entry) => entry.id === summary.label)
      if (summary.label === "audience") return "Who loves the leading tastes, by age and gender"
      return `What people nearby love: ${(domain?.label ?? text(summary.label)).toLowerCase()}`
    }
    case "qloo.overlap":
      return `Do fans of ${text(input.anchor)} also love ${text(input.target)}?`
    case "places.details":
      return "Your venue as Google sees it"
    case "places.nearby":
      return typeof summary.count === "number" ? `${summary.count} venues competing nearby` : "Venues competing nearby"
    case "ticketmaster.events":
      return typeof summary.count === "number"
        ? `${summary.count} ticketed events on the night`
        : "Ticketed events on the night"
    case "planner.themes":
      return "Grouping what is already on into themes"
    case "planner.concepts":
      return typeof summary.candidates === "number" ? `${summary.candidates} nights invented` : "Inventing nights"
    case "encore.score":
      return "Every claim checked against its receipt, then scored"
    default:
      return tool
  }
}

export interface StepRowLike {
  id: string
  tool: string
  status: string
  input: unknown
  output_summary: unknown
  qloo_cache_id: string | null
  latency_ms: number | null
}

export function toToolLine(row: StepRowLike): ToolLine {
  const input = (row.input ?? {}) as JsonObject
  const summary = (row.output_summary ?? {}) as JsonObject
  return {
    id: row.id,
    tool: row.tool,
    source: TOOL_SOURCES[row.tool] ?? "Loudnight",
    label: describeTool(row.tool, input, summary),
    ok: row.status === "succeeded",
    latencyMs: row.latency_ms,
    fromCache: summary.fromCache === true,
    hasReceipt: row.qloo_cache_id !== null,
  }
}
