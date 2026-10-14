import { TALENT, type PopularityTier, type TalentSource } from "@/config/series"
import type { TalentProfile } from "./talent.profile"

export interface RankedAct {
  entityId: string
  name: string
  popularity: number | null
  affinity: number
  index: number
  profile: TalentProfile
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

const SOURCE_ORDER: TalentSource[] = ["both", "area", "night"]

// Acts the venue could really book, local first: fans of the night who are also the area's own favourites, then the
// area's favourites, then the rest of the night's fits. National names never appear here.
export function shortlistOf<T extends RankedAct>(
  night: T[],
  area: T[],
  size: number = TALENT.shortlistSize,
): (T & { source: TalentSource })[] {
  const areaRank = new Map(area.map((act, position) => [act.entityId, position]))
  const nightIds = new Set(night.map((act) => act.entityId))
  const sourced = [
    ...night.map((act) => ({ ...act, source: (areaRank.has(act.entityId) ? "both" : "night") as TalentSource })),
    ...area.filter((act) => !nightIds.has(act.entityId)).map((act) => ({ ...act, source: "area" as TalentSource })),
  ]
  const placeInArea = (act: RankedAct) => areaRank.get(act.entityId) ?? area.length
  return sourced
    .filter((act) => tierOf(act.popularity) !== "national")
    .sort(
      (a, b) =>
        SOURCE_ORDER.indexOf(a.source) - SOURCE_ORDER.indexOf(b.source) ||
        tierRank(a) - tierRank(b) ||
        placeInArea(a) - placeInArea(b) ||
        b.affinity - a.affinity,
    )
    .slice(0, size)
}

// Looking again moves one page on through Qloo's answer, and comes back to the first page after the last.
export const nextPage = (current: number) => (current >= TALENT.pages ? 1 : current + 1)

// Famous names are shown only as a style to look for, never as someone to message.
export function styleReferences<T extends RankedAct>(acts: T[], taken: readonly string[]): T[] {
  return acts
    .filter((act) => tierOf(act.popularity) === "national" && !taken.includes(act.entityId))
    .sort((a, b) => b.affinity - a.affinity)
    .slice(0, TALENT.referenceCount)
}

// A working musician has listeners. Without this, anyone famous who once released a single is offered as a booking.
export const activeMusicians = <T extends RankedAct>(acts: T[]): T[] =>
  acts.filter((act) => (act.profile.listeners ?? 0) >= TALENT.minListeners)
