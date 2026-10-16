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

// Open data for performers Qloo knows few of. Both ask callers to name themselves; MusicBrainz allows one call a second.
export const OPEN_DATA = {
  userAgent: "Loudnight/0.1 (https://encore-seven-dusky.vercel.app)",
  cacheTtlDays: 7,
  wikidata: { url: "https://query.wikidata.org/sparql", timeoutMs: 25_000 },
  musicbrainz: { url: "https://musicbrainz.org/ws/2", timeoutMs: 10_000 },
} as const

// Where a performer with no photo gets one: their artist picture on Deezer, else an album cover on iTunes. No keys.
export const PICTURES = {
  deezer: { url: "https://api.deezer.com", timeoutMs: 6_000 },
  itunes: { url: "https://itunes.apple.com", timeoutMs: 6_000 },
  hosts: [
    "cdn-images.dzcdn.net",
    "e-cdns-images.dzcdn.net",
    "is1-ssl.mzstatic.com",
    "is2-ssl.mzstatic.com",
    "is3-ssl.mzstatic.com",
    "is4-ssl.mzstatic.com",
    "is5-ssl.mzstatic.com",
  ],
} as const
