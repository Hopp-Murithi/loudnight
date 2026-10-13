import type { PopularityBand } from "@/lib/qloo/requests"
import { QLOO_TAG_TYPES, type QlooEntityType } from "./integrations"

export type TasteDomainId =
  | "music"
  | "film"
  | "tv"
  | "books"
  | "podcasts"
  | "brands"
  | "people"
  | "destinations"
  | "places"
  | "music_styles"
  | "place_styles"

export type TasteDomainSource =
  | { kind: "entities"; type: QlooEntityType; popularity?: PopularityBand }
  | { kind: "nearby_places" }
  | { kind: "tags"; tagType: string }

export interface TasteDomain {
  id: TasteDomainId
  label: string
  source: TasteDomainSource
}

// The fingerprint's domains, in the order the card shows them. Each one is a request recipe plan 02 proved.
export const TASTE_DOMAINS: TasteDomain[] = [
  { id: "music_styles", label: "Music styles", source: { kind: "tags", tagType: QLOO_TAG_TYPES.music } },
  { id: "place_styles", label: "Kinds of night out", source: { kind: "tags", tagType: QLOO_TAG_TYPES.place } },
  { id: "music", label: "Artists", source: { kind: "entities", type: "urn:entity:artist", popularity: { min: 0.3 } } },
  { id: "places", label: "Places nearby", source: { kind: "nearby_places" } },
  { id: "film", label: "Films", source: { kind: "entities", type: "urn:entity:movie" } },
  { id: "tv", label: "TV", source: { kind: "entities", type: "urn:entity:tv_show" } },
  { id: "brands", label: "Brands", source: { kind: "entities", type: "urn:entity:brand" } },
  { id: "books", label: "Books", source: { kind: "entities", type: "urn:entity:book" } },
  {
    id: "podcasts",
    label: "Podcasts",
    source: { kind: "entities", type: "urn:entity:podcast", popularity: { max: null } },
  },
  { id: "people", label: "People", source: { kind: "entities", type: "urn:entity:person" } },
  { id: "destinations", label: "Places they travel", source: { kind: "entities", type: "urn:entity:destination" } },
]

export const FINGERPRINT_TOP_ITEMS = 5
export const AUDIENCE_TAG_COUNT = 3

export const AGE_BAND_LABELS: Record<string, string> = {
  "24_and_younger": "24 and under",
  "25_to_29": "25 to 29",
  "30_to_34": "30 to 34",
  "35_to_44": "35 to 44",
  "45_to_54": "45 to 54",
  "55_and_older": "55 and over",
}

// Music "genres" Qloo returns that are really places. They say where people are, not what they listen to.
export const PLACE_LIKE_TAGS = ["usa", "american", "new york", "brooklyn", "chicago", "austin", "texas", "london"]
