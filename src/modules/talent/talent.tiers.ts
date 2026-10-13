import { TALENT, type PopularityTier } from "@/config/series"

export interface RankedAct {
  entityId: string
  name: string
  popularity: number | null
  affinity: number
  index: number
}

// Unknown popularity reads as emerging: an act Qloo barely knows is not a touring name.
export function tierOf(popularity: number | null): PopularityTier {
  const value = popularity ?? 0
  if (value < TALENT.tierCeilings.emerging) return "emerging"
  if (value < TALENT.tierCeilings.local) return "local"
  if (value < TALENT.tierCeilings.regional) return "regional"
  return "national"
}

const TIER_ORDER: PopularityTier[] = ["local", "emerging", "regional", "national"]
const tierRank = (act: RankedAct) => TIER_ORDER.indexOf(tierOf(act.popularity))

export const overlapOf = (affinity: number) => Math.round(Math.min(1, Math.max(0, affinity)) * 1000) / 1000

// Acts the venue could really book, best fit first within the most bookable tiers. National names never appear here.
export function bookable<T extends RankedAct>(acts: T[]): T[] {
  return acts
    .filter((act) => tierOf(act.popularity) !== "national")
    .sort((a, b) => tierRank(a) - tierRank(b) || b.affinity - a.affinity)
    .slice(0, TALENT.shortlistSize)
}

// Famous names are shown only as a style to look for, never as someone to message.
export function styleReferences<T extends RankedAct>(acts: T[], taken: readonly string[]): T[] {
  return acts
    .filter((act) => tierOf(act.popularity) === "national" && !taken.includes(act.entityId))
    .sort((a, b) => b.affinity - a.affinity)
    .slice(0, TALENT.referenceCount)
}
