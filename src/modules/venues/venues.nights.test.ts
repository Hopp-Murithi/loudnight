import { describe, expect, it } from "vitest"
import { moveNight, nightOf, toggleNight } from "./venues.nights"

describe("quiet nights", () => {
  it("adds a night at the end, removes one, and stops at three", () => {
    expect(toggleNight(["tuesday"], "thursday")).toEqual(["tuesday", "thursday"])
    expect(toggleNight(["tuesday", "thursday"], "tuesday")).toEqual(["thursday"])
    expect(toggleNight(["monday", "tuesday", "wednesday"], "sunday")).toEqual(["monday", "tuesday", "wednesday"])
  })

  it("moves a night up or down and ignores a move past either end", () => {
    expect(moveNight(["monday", "tuesday", "wednesday"], 2, -1)).toEqual(["monday", "wednesday", "tuesday"])
    expect(moveNight(["monday", "tuesday"], 0, 1)).toEqual(["tuesday", "monday"])
    expect(moveNight(["monday", "tuesday"], 0, -1)).toEqual(["monday", "tuesday"])
    expect(moveNight(["monday", "tuesday"], 1, 1)).toEqual(["monday", "tuesday"])
  })

  it("picks the night asked for only when the venue has it", () => {
    expect(nightOf(["tuesday", "thursday"], "thursday")).toBe("thursday")
    expect(nightOf(["tuesday", "thursday"], "sunday")).toBe("tuesday")
    expect(nightOf(["tuesday", "thursday"], undefined)).toBe("tuesday")
    expect(nightOf(["tuesday", "thursday"], ["thursday"])).toBe("tuesday")
    expect(nightOf([], "tuesday")).toBeUndefined()
  })
})
