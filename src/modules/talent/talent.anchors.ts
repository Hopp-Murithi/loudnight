import { isPresentableName } from "@/config/content"
import { TALENT } from "@/config/series"
import type { QlooInsights } from "@/lib/qloo/schemas"
import { buildSignals, type Signal } from "@/modules/concepts/concepts.signals"
import type { RunContext } from "@/modules/runs/runs.schemas"
import type { RankedAct } from "./talent.tiers"

// The tastes the chosen night was built on. If the plan no longer names them, the area's leading music styles stand in.
export function conceptAnchors(conceptName: string, context: RunContext): Signal[] {
  if (!context.fingerprint) return []
  const signals = buildSignals(context.fingerprint)
  const candidate = context.invention?.candidates.find((entry) => entry.name === conceptName)
  const cited = signals.filter((signal) => candidate?.signalIds.includes(signal.id))
  const anchors = cited.length > 0 ? cited : signals.filter((signal) => signal.domain === "music_styles")
  return anchors.slice(0, TALENT.anchorCount)
}

// Every act in a Qloo answer that carries an affinity, with its place in the list so a receipt can point at it.
export function actsFrom(response: QlooInsights): RankedAct[] {
  return (response.results?.entities ?? []).flatMap((entity, index) => {
    const affinity = entity.query?.affinity
    if (affinity === undefined || !isPresentableName(entity.name)) return []
    return [{ entityId: entity.entity_id, name: entity.name, popularity: entity.popularity ?? null, affinity, index }]
  })
}

export const actReceiptPath = (index: number) => ["results", "entities", String(index), "query", "affinity"]
