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
  // How many of Qloo's acts are checked for home country and fame before the shortlist is chosen.
  vetPool: 20,
  referenceCount: 4,
  anchorCount: 3,
  minListeners: 1000,
  pages: 3,
} as const

// Why an act is on the shortlist: the night's tastes, the area's own favourites, both, or an open data record.
export type TalentSource = "night" | "area" | "both" | "wikidata" | "musicbrainz"

export const OPEN_SOURCES = ["wikidata", "musicbrainz"] as const satisfies readonly TalentSource[]
export type OpenSource = (typeof OPEN_SOURCES)[number]
export const isOpenSource = (source: string): source is OpenSource => OPEN_SOURCES.some((open) => open === source)

export const OPEN_SOURCE_LABELS: Record<OpenSource, string> = { wikidata: "Wikidata", musicbrainz: "MusicBrainz" }

// Open data fills in the kinds of act Qloo knows few of. Wikidata occupations by item id; fame is capped by how many
// Wikipedia languages describe a person, so household names stay out.
export const OPEN_TALENT = {
  roles: {
    poet: ["Q49757"],
    comedian: ["Q245068", "Q18545066"],
    dj: ["Q130857"],
    musician: ["Q177220", "Q2252262", "Q488205", "Q639669"],
  },
  nearbyKm: 50,
  maxLanguages: 20,
  bornAfter: 1955,
  fetch: 20,
  keep: 4,
} as const

export type OpenRole = keyof typeof OPEN_TALENT.roles

export const TIER_LABELS: Record<PopularityTier, string> = {
  emerging: "Emerging",
  local: "Local draw",
  regional: "Regional name",
  national: "Style reference",
}

// Musicians are the talent for music nights. Every other format looks for people: hosts, comics, speakers.
export const MUSIC_FORMATS: readonly string[] = ["live_music", "dj_night"]
