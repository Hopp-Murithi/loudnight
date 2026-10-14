import { describe, expect, it } from "vitest"
import { sceneAt, stageVars, storyPosition } from "./stage-math"

describe("storyPosition", () => {
  it("runs from the first scene to the last as the stage scrolls past", () => {
    expect(storyPosition(0, 100, 5000, 1000, 5)).toBe(0)
    expect(storyPosition(2100, 100, 5000, 1000, 5)).toBe(2)
    expect(storyPosition(9000, 100, 5000, 1000, 5)).toBe(4)
  })
})

describe("stageVars", () => {
  it("shows exactly the scene the visitor is on", () => {
    const vars = stageVars(2, 5)
    expect(vars["--v2"]).toBe("1.000")
    expect(vars["--v1"]).toBe("0.000")
    expect(vars["--v3"]).toBe("0.000")
  })

  it("never shows two headlines at once, even when two pictures are cross-fading", () => {
    for (const position of [0.3, 0.5, 1.5, 2.7]) {
      const vars = stageVars(position, 5)
      const showing = [0, 1, 2, 3, 4].filter((index) => Number(vars[`--t${index}`]) > 0)
      expect(showing.length).toBeLessThanOrEqual(1)
    }
  })

  it("cross-fades between two scenes halfway through a scroll", () => {
    const vars = stageVars(1.5, 5)
    expect(Number(vars["--v1"])).toBeGreaterThan(0)
    expect(Number(vars["--v2"])).toBeGreaterThan(0)
    expect(sceneAt(1.4)).toBe(1)
    expect(sceneAt(1.6)).toBe(2)
  })

  it("closes in on the map as the visitor moves from the world to Kenya", () => {
    expect(stageVars(0, 5)["--world-zoom"]).toBe("1.000")
    expect(stageVars(1, 5)["--world-zoom"]).toBe("8.000")
    expect(Number(stageVars(2, 5)["--kenya-zoom"])).toBeGreaterThan(Number(stageVars(1, 5)["--kenya-zoom"]))
  })
})
