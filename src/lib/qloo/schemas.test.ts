import { describe, expect, it } from "vitest"
import { isEmptyInsight, qlooInsightsSchema } from "./schemas"

// Hand-written in the shape the probe recorded. Never a real Qloo response.
const syntheticEntities = {
  _synthetic: true,
  success: true,
  results: {
    entities: [
      {
        entity_id: "SYNTHETIC-ARTIST-1",
        name: "Sample Artist",
        type: "urn:entity",
        popularity: 0.42,
        tags: [{ id: "urn:tag:genre:music:sample", name: "Sample", type: "urn:tag:genre:music" }],
        query: { affinity: 0.91, measurements: { audience_growth: 0 } },
        external: { spotify: [{ id: "x" }] },
      },
    ],
  },
}

describe("qlooInsightsSchema", () => {
  it("accepts a response in the recorded shape and keeps every field", () => {
    const parsed = qlooInsightsSchema.parse(syntheticEntities)
    expect(parsed.results?.entities?.[0].query?.affinity).toBe(0.91)
    expect(parsed.results?.entities?.[0]).toHaveProperty("external")
    expect(parsed).toHaveProperty("_synthetic", true)
  })

  it("accepts an entity tag that carries only its type", () => {
    const partial = {
      _synthetic: true,
      results: { entities: [{ entity_id: "SYN", name: "Sample", tags: [{ type: "urn:tag:voice_type:qloo" }] }] },
    }
    expect(qlooInsightsSchema.safeParse(partial).success).toBe(true)
  })

  it("rejects a tag without its affinity, which every receipt points at", () => {
    const missing = { _synthetic: true, results: { tags: [{ tag_id: "urn:tag:x", name: "X", query: {} }] } }
    expect(qlooInsightsSchema.safeParse(missing).success).toBe(false)
  })

  it("reads the age and gender lean of a taste", () => {
    const audience = {
      _synthetic: true,
      results: {
        demographics: [{ entity_id: "urn:tag:x", query: { age: { "25_to_29": 0.5 }, gender: { female: 0.2 } } }],
      },
    }
    expect(qlooInsightsSchema.parse(audience).results?.demographics?.[0].query.age).toEqual({ "25_to_29": 0.5 })
  })
})

describe("isEmptyInsight", () => {
  it("tells no data apart from data", () => {
    expect(isEmptyInsight({ success: true, results: { entities: [] } })).toBe(true)
    expect(isEmptyInsight({ success: true })).toBe(true)
    expect(isEmptyInsight(qlooInsightsSchema.parse(syntheticEntities))).toBe(false)
  })
})
