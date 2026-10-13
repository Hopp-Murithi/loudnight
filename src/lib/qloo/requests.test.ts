import { describe, expect, it } from "vitest"
import {
  areaTagsRequest,
  heatmapRequest,
  metresToMiles,
  nearbyPlacesRequest,
  searchRequest,
  tagsRequest,
  tasteAudienceRequest,
  tasteEntitiesRequest,
  wktPoint,
} from "./requests"

const williamsburg = { latitude: 40.7174, longitude: -73.9575 }

describe("wktPoint", () => {
  it("puts longitude first, as WKT requires", () => {
    expect(wktPoint(williamsburg)).toBe("POINT(-73.9575 40.7174)")
  })
})

describe("metresToMiles", () => {
  it.each([
    [1609.344, 1],
    [2000, 1.24],
    [0, 0],
    [-50, 0],
    [500_000, 100],
  ])("%d metres is %d miles", (metres, miles) => {
    expect(metresToMiles(metres)).toBe(miles)
  })
})

describe("request builders", () => {
  it.each([
    [
      "taste entities",
      tasteEntitiesRequest("urn:entity:artist", williamsburg),
      "/v2/insights",
      {
        "filter.type": "urn:entity:artist",
        "signal.location": "POINT(-73.9575 40.7174)",
        "filter.popularity.max": 0.7,
        take: 20,
      },
    ],
    [
      "area tags",
      areaTagsRequest(williamsburg, "urn:tag:genre:music"),
      "/v2/insights",
      {
        "filter.type": "urn:tag",
        "filter.tag.types": "urn:tag:genre:music",
        "signal.location": "POINT(-73.9575 40.7174)",
        take: 20,
      },
    ],
    [
      "nearby places",
      nearbyPlacesRequest(williamsburg),
      "/v2/insights",
      {
        "filter.type": "urn:entity:place",
        "filter.location": "POINT(-73.9575 40.7174)",
        "filter.location.radius": 2000,
        "signal.location": "POINT(-73.9575 40.7174)",
        take: 20,
      },
    ],
    [
      "taste audience",
      tasteAudienceRequest(["urn:tag:genre:music:afrobeats"]),
      "/v2/insights",
      { "filter.type": "urn:demographics", "signal.interests.tags": ["urn:tag:genre:music:afrobeats"] },
    ],
    [
      "heatmap",
      heatmapRequest(williamsburg, ["urn:tag:genre:music:afrobeats"]),
      "/v2/insights",
      {
        "filter.type": "urn:heatmap",
        "filter.location": "POINT(-73.9575 40.7174)",
        "signal.interests.tags": ["urn:tag:genre:music:afrobeats"],
      },
    ],
    [
      "search near a point",
      searchRequest("bar", ["urn:entity:place"], { point: williamsburg, radiusMetres: 1609.344 }),
      "/search",
      {
        query: "bar",
        types: ["urn:entity:place"],
        take: 20,
        "filter.location": "40.7174,-73.9575",
        "filter.radius": 1,
      },
    ],
    [
      "tag lookup",
      tagsRequest("afro", "urn:tag:genre:music"),
      "/v2/tags",
      {
        "filter.query": "afro",
        "filter.tag.types": "urn:tag:genre:music",
        take: 20,
      },
    ],
  ])("%s uses exactly the proven parameters", (_name, request, path, params) => {
    expect(request).toEqual({ path, params })
  })

  it("adds a popularity floor when given", () => {
    const params = tasteEntitiesRequest("urn:entity:artist", williamsburg, { min: 0.3 }).params
    expect(params).toMatchObject({ "filter.popularity.min": 0.3, "filter.popularity.max": 0.7 })
  })

  it("leaves the popularity cap out when asked to", () => {
    const params = tasteEntitiesRequest("urn:entity:podcast", williamsburg, { max: null }).params
    expect(params).not.toHaveProperty(["filter.popularity.max"])
  })

  it("leaves the optional search and tag filters out when not given", () => {
    expect(searchRequest("Burna Boy", ["urn:entity:artist"]).params).not.toHaveProperty(["filter.location"])
    expect(tagsRequest("afro").params).not.toHaveProperty(["filter.tag.types"])
  })
})
