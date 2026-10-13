import { describe, expect, it } from "vitest"
import { TASTE_DOMAINS } from "@/config/taste"
import type { QlooInsights } from "@/lib/qloo/schemas"
import { audienceSkew, domainResult, failedDomain, normaliseScores, tidyName } from "./taste.fingerprint"

const CACHE_ID = "00000000-0000-4000-8000-000000000001"
const domainById = (id: string) => {
  const domain = TASTE_DOMAINS.find((candidate) => candidate.id === id)
  if (!domain) throw new Error(`No domain ${id}`)
  return domain
}
const musicStyles = domainById("music_styles")
const artists = domainById("music")

// Follows a receipt path the way Postgres `#>>` does, so the test proves each path resolves.
const at = (value: unknown, path: string[]): unknown =>
  path.reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], value)

const syntheticTags: QlooInsights & { _synthetic: true } = {
  _synthetic: true,
  success: true,
  results: {
    tags: [
      { tag_id: "urn:tag:genre:music:synthetic_a", name: " alt- sample", query: { affinity: 0.99 } },
      { tag_id: "urn:tag:genre:music:synthetic_b", name: "Sample B", query: { affinity: 0.98 } },
    ],
  },
}

const syntheticEntities: QlooInsights & { _synthetic: true } = {
  _synthetic: true,
  success: true,
  results: {
    entities: [
      { entity_id: "SYN-1", name: "Sample One", popularity: 0.4, query: { affinity: 1 } },
      { entity_id: "SYN-2", name: "No Query" },
      { entity_id: "SYN-3", name: "Sample Three", query: { affinity: 0.95 } },
    ],
  },
}

describe("normaliseScores", () => {
  it.each([
    [[], []],
    [[5], [1]],
    [
      [3, 3, 3],
      [1, 1, 1],
    ],
    [
      [2, 4, 6],
      [0, 0.5, 1],
    ],
  ])("%j becomes %j", (input, output) => {
    expect(normaliseScores(input)).toEqual(output)
  })
})

describe("tidyName", () => {
  it("trims, joins broken hyphens and capitalises", () => {
    expect(tidyName(" alt-  country ")).toBe("Alt-country")
    expect(tidyName("americana")).toBe("Americana")
  })
})

describe("domainResult", () => {
  it("keeps Qloo's order and points every receipt at the real value", () => {
    const result = domainResult(musicStyles, syntheticTags, CACHE_ID)
    expect(result.status).toBe("ok")
    expect(result.items.map((item) => item.name)).toEqual(["Alt-sample", "Sample B"])
    expect(result.items.map((item) => item.score)).toEqual([1, 0])
    result.items.forEach((item) => {
      expect(item.receipt.cacheId).toBe(CACHE_ID)
      expect(at(syntheticTags, item.receipt.path)).toBe(item.affinity)
    })
  })

  it("skips entities without an affinity but keeps the original index in the path", () => {
    const result = domainResult(artists, syntheticEntities, CACHE_ID)
    expect(result.items.map((item) => item.id)).toEqual(["SYN-1", "SYN-3"])
    expect(result.items[1].receipt.path).toEqual(["results", "entities", "2", "query", "affinity"])
    expect(at(syntheticEntities, result.items[1].receipt.path)).toBe(0.95)
  })

  it("never shows a blocked name, and keeps Qloo's index in the receipt for the rest", () => {
    const blocked = String.fromCharCode(110, 105, 103, 103, 97)
    const response = {
      _synthetic: true,
      success: true,
      results: {
        entities: [
          { entity_id: "SYN-X", name: `Young ${blocked}`, query: { affinity: 1 } },
          { entity_id: "SYN-Y", name: "Fine Name", query: { affinity: 0.9 } },
        ],
      },
    }
    const result = domainResult(artists, response, CACHE_ID)
    expect(result.items.map((item) => item.id)).toEqual(["SYN-Y"])
    expect(result.items[0].receipt.path).toEqual(["results", "entities", "1", "query", "affinity"])
  })

  it("leaves out music tags that are really places", () => {
    const response = {
      _synthetic: true,
      success: true,
      results: {
        tags: [
          { tag_id: "urn:tag:genre:music:usa", name: "Usa", query: { affinity: 1 } },
          { tag_id: "urn:tag:genre:music:synthetic", name: "Synthetic jazz", query: { affinity: 0.99 } },
        ],
      },
    }
    expect(domainResult(musicStyles, response, CACHE_ID).items.map((item) => item.name)).toEqual(["Synthetic jazz"])
  })

  it("marks a domain with no results as empty, never drops it", () => {
    const result = domainResult(artists, { success: true, results: { entities: [] } }, CACHE_ID)
    expect(result).toMatchObject({ domain: "music", status: "empty", items: [] })
  })

  it("marks a failed domain", () => {
    expect(failedDomain(artists)).toMatchObject({ domain: "music", status: "failed", items: [] })
  })
})

describe("audienceSkew", () => {
  const syntheticAudience = {
    _synthetic: true,
    success: true,
    results: {
      demographics: [
        {
          entity_id: "urn:tag:synthetic",
          query: { age: { "25_to_29": 0.6, "55_and_older": -0.4 }, gender: { female: 0.3 } },
        },
      ],
    },
  }

  it("labels each band and keeps a resolving receipt", () => {
    const skew = audienceSkew(syntheticAudience, CACHE_ID, [{ id: "urn:tag:synthetic", name: "Synthetic" }])
    expect(skew?.age.map((lean) => lean.label)).toEqual(["25 to 29", "55 and over"])
    expect(skew?.gender[0]).toMatchObject({ label: "Women", value: 0.3 })
    skew?.age.forEach((lean) => expect(at(syntheticAudience, lean.receipt.path)).toBe(lean.value))
  })

  it("is null when Qloo returns no audience row", () => {
    expect(audienceSkew({ success: true, results: {} }, CACHE_ID, [])).toBeNull()
  })
})
