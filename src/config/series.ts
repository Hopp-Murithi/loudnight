import type { Enums } from "@/types/database"

export type PopularityTier = Enums<"popularity_tier">

export const SERIES = {
  nights: 4,
  startHour: 20,
  startMinute: 0,
  variationMax: 200,
  slugNameMax: 40,
} as const

export const WEEK_NAMES = ["Opening night", "Week two", "Week three", "Finale"] as const

// Used when the copywriter does not answer or slips a number in: plain, true of any night, and still distinct.
export const FALLBACK_VARIATIONS = [
  "Opening night: the idea in full, with a welcome for everyone who walks in.",
  "A guest joins in: a second act chosen for the same crowd.",
  "A menu special made to match the night.",
  "Bring a friend: regulars bring someone new for the finale.",
] as const

// Qloo popularity runs from zero to one. Acts a neighbourhood bar can book sit in the lower half.
export const TALENT = {
  tierCeilings: { emerging: 0.4, local: 0.6, regional: 0.8 },
  referenceMin: 0.8,
  shortlistSize: 8,
  referenceCount: 4,
  anchorCount: 3,
} as const

export const TIER_LABELS: Record<PopularityTier, string> = {
  emerging: "Emerging",
  local: "Local draw",
  regional: "Regional name",
  national: "Style reference",
}

// Musicians are the talent for music nights. Every other format looks for people: hosts, comics, speakers.
export const MUSIC_FORMATS: readonly string[] = ["live_music", "dj_night"]
