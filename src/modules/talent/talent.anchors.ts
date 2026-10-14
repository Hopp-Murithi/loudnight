import { isPresentableName } from "@/config/content"
import { TALENT } from "@/config/series"
import type { QlooInsights } from "@/lib/qloo/schemas"
import { buildSignals, type Signal } from "@/modules/concepts/concepts.signals"
import type { RunContext } from "@/modules/runs/runs.schemas"
import { profileFrom } from "./talent.profile"
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

// The area's own sound: music styles named after the venue's country, such as "Kenyan" for a venue in Kenya. Asking
// Qloo who fans of that sound follow brings home-grown acts forward, where the area alone returns regional stars.
export function localSoundAnchors(context: RunContext, country: string): Signal[] {
  if (!context.fingerprint || country.length < 4) return []
  const stem = country.slice(0, 5).toLowerCase()
  return buildSignals(context.fingerprint)
    .filter(
      (signal) =>
        signal.domain === "music_styles" &&
        signal.name.toLowerCase().startsWith(stem.slice(0, Math.max(4, stem.length - 1))),
    )
    .slice(0, 2)
}

// Every act in a Qloo answer that carries an affinity, with its place in the list so a receipt can point at it.
export function actsFrom(response: QlooInsights): RankedAct[] {
  return (response.results?.entities ?? []).flatMap((entity, index) => {
    const affinity = entity.query?.affinity
    if (affinity === undefined || !isPresentableName(entity.name)) return []
    return [
      {
        entityId: entity.entity_id,
        name: entity.name,
        popularity: entity.popularity ?? null,
        affinity,
        index,
        profile: profileFrom(entity),
      },
    ]
  })
}

// What a booking message may mention: the music and nights out a crowd likes, not the brands or shows it follows.
export function messageTastes(anchors: Signal[]): string[] {
  const musical = anchors.filter((anchor) => anchor.category === "music" || anchor.category === "night_out")
  return (musical.length > 0 ? musical : anchors).map((anchor) => anchor.name)
}

export const actReceiptPath = (index: number) => ["results", "entities", String(index), "query", "affinity"]
