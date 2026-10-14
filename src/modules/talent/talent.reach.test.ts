import { describe, expect, it } from "vitest"
import { reachOf } from "./talent.reach"

describe("reachOf", () => {
  it("keeps a household name beyond a small budget, however few listeners it shows", () => {
    expect(reachOf({ listeners: 668_000, star: true }, 50_000_000, "KES")).toBe("beyond")
    expect(reachOf({ listeners: 20_000, star: true }, 50_000_000, "KES")).toBe("beyond")
  })

  it("labels by listeners at the typical small-venue fee", () => {
    expect(reachOf({ listeners: 9_800, star: false }, 5_000_000, "KES")).toBe("within")
    expect(reachOf({ listeners: 226_000, star: false }, 5_000_000, "KES")).toBe("stretch")
    expect(reachOf({ listeners: 1_400_000, star: false }, 5_000_000, "KES")).toBe("beyond")
  })

  it("reaches bigger acts with a bigger budget, and treats unknown listeners as small", () => {
    expect(reachOf({ listeners: 226_000, star: false }, 50_000_000, "KES")).toBe("within")
    expect(reachOf({ listeners: null, star: null }, 0, "USD")).toBe("within")
    expect(reachOf({ listeners: 100_000, star: null }, 50_000, "XYZ")).toBe("stretch")
  })
})
