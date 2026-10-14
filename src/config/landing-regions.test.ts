import { describe, expect, it } from "vitest"
import { REGION_MAPS } from "./landing-maps"
import { LANDING_REGIONS, regionFor } from "./landing-regions"

describe("regionFor", () => {
  it("zooms into the visitor's own country, or the nearest one with a map", () => {
    expect(regionFor("KE").id).toBe("kenya")
    expect(regionFor("ug").id).toBe("kenya")
    expect(regionFor("NG").id).toBe("nigeria")
    expect(regionFor("GB").id).toBe("uk")
    expect(regionFor("ES").id).toBe("france")
    expect(regionFor("JP").id).toBe("japan")
  })

  it("shows the United States when the country is unknown or missing", () => {
    expect(regionFor("ZZ").id).toBe("us")
    expect(regionFor(null).id).toBe("us")
  })

  it("lets a region asked for by name win, and ignores one that does not exist", () => {
    expect(regionFor("US", "kenya").id).toBe("kenya")
    expect(regionFor("KE", "atlantis").id).toBe("kenya")
  })
})

describe("every region", () => {
  it("has a map with towns, six tastes and a night", () => {
    for (const region of Object.values(LANDING_REGIONS)) {
      expect(REGION_MAPS[region.id].towns.length).toBeGreaterThan(3)
      expect(region.tastes).toHaveLength(6)
      expect(region.night.name.length).toBeGreaterThan(0)
    }
  })
})
