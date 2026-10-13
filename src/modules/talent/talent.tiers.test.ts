import { describe, expect, it } from "vitest"
import { bookable, overlapOf, styleReferences, tierOf, type RankedAct } from "./talent.tiers"

const act = (entityId: string, popularity: number | null, affinity: number): RankedAct => ({
  entityId,
  name: "Sample act " + entityId,
  popularity,
  affinity,
  index: 0,
})

describe("tierOf", () => {
  it("places popularity on the four tiers at their thresholds", () => {
    expect(tierOf(0.39)).toBe("emerging")
    expect(tierOf(0.4)).toBe("local")
    expect(tierOf(0.6)).toBe("regional")
    expect(tierOf(0.8)).toBe("national")
    expect(tierOf(null)).toBe("emerging")
  })
})

describe("bookable", () => {
  it("never includes a national act, however well it fits", () => {
    const acts = [act("a", 0.95, 1), act("b", 0.5, 0.7), act("c", 0.2, 0.9)]
    expect(bookable(acts).map((item) => item.entityId)).toEqual(["b", "c"])
  })

  it("puts local draws first, then emerging, then regional, best fit first within each", () => {
    const acts = [act("r", 0.7, 0.99), act("e", 0.1, 0.9), act("l1", 0.5, 0.6), act("l2", 0.45, 0.8)]
    expect(bookable(acts).map((item) => item.entityId)).toEqual(["l2", "l1", "e", "r"])
  })

  it("keeps the shortlist to eight", () => {
    const many = Array.from({ length: 12 }, (_, index) => act(String(index), 0.5, index / 12))
    expect(bookable(many)).toHaveLength(8)
  })
})

describe("styleReferences", () => {
  it("lists only national names that are not already shortlisted", () => {
    const acts = [act("a", 0.9, 0.8), act("b", 0.85, 0.95), act("c", 0.5, 1)]
    expect(styleReferences(acts, ["a"]).map((item) => item.entityId)).toEqual(["b"])
  })
})

describe("overlapOf", () => {
  it("fits the database column: three decimals between zero and one", () => {
    expect(overlapOf(0.98765)).toBe(0.988)
    expect(overlapOf(1.2)).toBe(1)
    expect(overlapOf(-0.1)).toBe(0)
  })
})
