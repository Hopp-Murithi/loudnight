import { describe, expect, it } from "vitest"
import { qlooRequestHash, toSearchParams } from "./request-hash"

describe("qlooRequestHash", () => {
  it("is the same whatever order the parameters arrive in", () => {
    const a = qlooRequestHash("/v2/insights", { "filter.type": "urn:entity:artist", take: 10, tags: ["b", "a"] })
    const b = qlooRequestHash("/v2/insights", { tags: ["a", "b"], take: 10, "filter.type": "urn:entity:artist" })
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })

  it("differs when the question differs", () => {
    expect(qlooRequestHash("/v2/insights", { take: 10 })).not.toBe(qlooRequestHash("/v2/insights", { take: 11 }))
    expect(qlooRequestHash("/v2/insights", { take: 10 })).not.toBe(qlooRequestHash("/search", { take: 10 }))
  })
})

describe("toSearchParams", () => {
  it("joins lists with commas", () => {
    expect(toSearchParams({ types: ["a", "b"], take: 5 }).toString()).toBe("types=a%2Cb&take=5")
  })
})
