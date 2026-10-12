import { describe, expect, it } from "vitest"
import { venueHome, venueNavigation } from "./navigation"

const labels = (role: "owner" | "manager" | "door") => venueNavigation("v1", role).map((item) => item.label)

describe("venueNavigation", () => {
  it("gives owners every item", () => {
    expect(labels("owner")).toEqual(["Overview", "Plan", "Series", "Door", "Results", "Team", "Settings", "History"])
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
    for (const hidden of ["Overview", "Results", "Team", "Settings", "History"]) {
      expect(labels("door")).not.toContain(hidden)
    }
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
