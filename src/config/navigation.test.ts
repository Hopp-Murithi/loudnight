import { describe, expect, it } from "vitest"
import { isActivePath, TAB_BAR_ITEMS, venueHome, venueIdFromPath, venueNavigation } from "./navigation"

const labels = (role: "owner" | "manager" | "door") => venueNavigation("v1", role).map((item) => item.label)

describe("venueNavigation", () => {
  it("gives owners every item", () => {
    expect(labels("owner")).toEqual([
      "Home",
      "Plan",
      "Series",
      "Promote",
      "Door",
      "Results",
      "Team",
      "Settings",
      "History",
    ])
  })

  it("gives managers everything, with the team read only", () => {
    expect(labels("manager")).toEqual(labels("owner"))
    expect(venueNavigation("v1", "manager").find((item) => item.label === "Team")?.access).toBe("view")
  })

  // Door staff check guests in; they never see money, settings or the team.
  it("gives door staff the door, and the plan and series read only", () => {
    const items = venueNavigation("v1", "door")
    expect(items.map((item) => item.label)).toEqual(["Plan", "Series", "Door"])
    expect(items.map((item) => item.access)).toEqual(["view", "view", "edit"])
    for (const hidden of ["Home", "Promote", "Results", "Team", "Settings", "History"]) {
      expect(labels("door")).not.toContain(hidden)
    }
  })

  it("marks the journey as primary, for the tab bar on phones, and the rest as upkeep", () => {
    const primary = venueNavigation("v1", "owner").filter((item) => item.primary)
    expect(primary.map((item) => item.label)).toEqual(["Home", "Plan", "Series", "Promote", "Door"])
    expect(primary.slice(0, TAB_BAR_ITEMS).map((item) => item.label)).toEqual(["Home", "Plan", "Series", "Promote"])
  })

  it("builds links for the venue in hand", () => {
    expect(venueNavigation("abc", "owner")[0].href).toBe("/venues/abc")
    expect(venueNavigation("abc", "door").at(-1)?.href).toBe("/venues/abc/door")
  })
})

describe("venueHome", () => {
  it("sends door staff to the door and everyone else to the overview", () => {
    expect(venueHome("v1", "door")).toBe("/venues/v1/door")
    expect(venueHome("v1", "manager")).toBe("/venues/v1")
  })
})

describe("path helpers", () => {
  it("reads the venue from the address", () => {
    const id = "8f6a1f8e-2c1b-4c55-9d2e-0b7a3c1e0001"
    expect(venueIdFromPath(`/venues/${id}/plan`)).toBe(id)
    expect(venueIdFromPath("/venues/new")).toBeNull()
  })

  it("matches a home exactly and other sections by prefix", () => {
    expect(isActivePath("/venues/v1/plan/r1", "/venues/v1/plan", ["/venues/v1"])).toBe(true)
    expect(isActivePath("/venues/v1/plan", "/venues/v1", ["/venues/v1"])).toBe(false)
  })
})
