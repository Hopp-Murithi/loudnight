import { QLOO, type QlooEntityType } from "@/config/integrations"
import type { QlooParams } from "./request-hash"

export interface QlooRequest {
  path: string
  params: QlooParams
}

export interface GeoPoint {
  latitude: number
  longitude: number
}

const METRES_PER_MILE = 1_609.344
const SEARCH_MAX_MILES = 100

// Qloo wants WKT, longitude first. `lat,lng` is refused with a 400.
export const wktPoint = ({ latitude, longitude }: GeoPoint) => `POINT(${longitude} ${latitude})`

// `/search` takes its radius in miles (0 to 100), unlike every insights parameter.
export function metresToMiles(metres: number): number {
  const miles = Math.max(0, metres) / METRES_PER_MILE
  return Math.min(SEARCH_MAX_MILES, Math.round(miles * 100) / 100)
}

export interface PopularityBand {
  min?: number
  max?: number | null
}

// What people around the point like in one domain. The cap brings up local names over global stars; null drops it.
export function tasteEntitiesRequest(type: QlooEntityType, point: GeoPoint, band: PopularityBand = {}): QlooRequest {
  const max = band.max === undefined ? QLOO.localPopularityMax : band.max
  const params: QlooParams = { "filter.type": type, "signal.location": wktPoint(point), take: QLOO.take }
  if (band.min !== undefined) params["filter.popularity.min"] = band.min
  if (max !== null) params["filter.popularity.max"] = max
  return { path: "/v2/insights", params }
}

// The tags that over-index around the point, such as genres of music or kinds of place.
export function areaTagsRequest(point: GeoPoint, tagType: string): QlooRequest {
  return {
    path: "/v2/insights",
    params: {
      "filter.type": "urn:tag",
      "filter.tag.types": tagType,
      "signal.location": wktPoint(point),
      take: QLOO.take,
    },
  }
}

// Venues within walking distance, ranked by the area's taste. `filter.location` keeps every result inside the radius.
export function nearbyPlacesRequest(point: GeoPoint, radiusMetres: number = QLOO.nearbyRadiusMetres): QlooRequest {
  const location = wktPoint(point)
  return {
    path: "/v2/insights",
    params: {
      "filter.type": "urn:entity:place",
      "filter.location": location,
      "filter.location.radius": radiusMetres,
      "signal.location": location,
      take: QLOO.take,
    },
  }
}

// The age and gender lean of the people who love these tags. It describes a taste's audience, not the area.
export function tasteAudienceRequest(tagIds: readonly string[]): QlooRequest {
  return { path: "/v2/insights", params: { "filter.type": "urn:demographics", "signal.interests.tags": tagIds } }
}

// Where in the area a taste is strongest, as geohash cells.
export function heatmapRequest(point: GeoPoint, tagIds: readonly string[]): QlooRequest {
  return {
    path: "/v2/insights",
    params: { "filter.type": "urn:heatmap", "filter.location": wktPoint(point), "signal.interests.tags": tagIds },
  }
}

export function searchRequest(
  query: string,
  types: readonly QlooEntityType[],
  near?: { point: GeoPoint; radiusMetres: number },
): QlooRequest {
  const params: QlooParams = { query, types, take: QLOO.take }
  if (near) {
    params["filter.location"] = `${near.point.latitude},${near.point.longitude}`
    params["filter.radius"] = metresToMiles(near.radiusMetres)
  }
  return { path: "/search", params }
}

// Tag ids must come from here: a guessed id such as `urn:tag:genre:place:bar` silently returns nothing.
export function tagsRequest(query: string, tagType?: string): QlooRequest {
  const params: QlooParams = { "filter.query": query, take: QLOO.take }
  if (tagType) params["filter.tag.types"] = tagType
  return { path: "/v2/tags", params }
}

export interface QlooSignalRef {
  kind: "tag" | "entity"
  qlooId: string
  qlooType: string
}

// Near here, what do fans of the anchor love in the target's domain? The target's affinity there is the overlap.
export function overlapRequest(anchor: QlooSignalRef, target: QlooSignalRef, point: GeoPoint): QlooRequest {
  const params: QlooParams = {
    "filter.type": target.kind === "tag" ? "urn:tag" : target.qlooType,
    [anchor.kind === "tag" ? "signal.interests.tags" : "signal.interests.entities"]: anchor.qlooId,
    "signal.location": wktPoint(point),
    take: QLOO.overlapTake,
  }
  if (target.kind === "tag") params["filter.tag.types"] = target.qlooType
  return { path: "/v2/insights", params }
}

// Acts that fans of these tastes follow near the point, kept inside a popularity band so they are bookable.
export function talentRequest(
  anchors: readonly QlooSignalRef[],
  type: QlooEntityType,
  point: GeoPoint,
  band: PopularityBand,
): QlooRequest {
  const params: QlooParams = { "filter.type": type, "signal.location": wktPoint(point), take: QLOO.take }
  const tags = anchors.filter((anchor) => anchor.kind === "tag").map((anchor) => anchor.qlooId)
  const entities = anchors.filter((anchor) => anchor.kind === "entity").map((anchor) => anchor.qlooId)
  if (tags.length > 0) params["signal.interests.tags"] = tags
  if (entities.length > 0) params["signal.interests.entities"] = entities
  if (band.min !== undefined) params["filter.popularity.min"] = band.min
  if (band.max !== undefined && band.max !== null) params["filter.popularity.max"] = band.max
  return { path: "/v2/insights", params }
}
