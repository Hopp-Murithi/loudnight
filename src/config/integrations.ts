// Upstream services the planning pipeline calls. Qloo parameters below were proven by plan 02's probe on Oct 13.
export const QLOO = {
  defaultUrl: "https://hackathon.api.qloo.com",
  cacheTtlDays: 7,
  timeoutMs: 20_000,
  take: 20,
  nearbyRadiusMetres: 2_000,
  localPopularityMax: 0.7,
  maxConcurrent: 3,
  overlapTake: 50,
} as const

// The entity types the hackathon host answers for a location. Video games return 400 there.
export const QLOO_ENTITY_TYPES = [
  "urn:entity:artist",
  "urn:entity:book",
  "urn:entity:brand",
  "urn:entity:destination",
  "urn:entity:movie",
  "urn:entity:person",
  "urn:entity:place",
  "urn:entity:podcast",
  "urn:entity:tv_show",
] as const

export type QlooEntityType = (typeof QLOO_ENTITY_TYPES)[number]

export const QLOO_TAG_TYPES = {
  music: "urn:tag:genre:music",
  place: "urn:tag:genre:place",
} as const

export const GOOGLE_PLACES = {
  url: "https://places.googleapis.com/v1",
  timeoutMs: 10_000,
} as const

export const TICKETMASTER = {
  url: "https://app.ticketmaster.com/discovery/v2",
  timeoutMs: 10_000,
} as const
