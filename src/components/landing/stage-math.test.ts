import { describe, expect, it } from "vitest"
import { sceneAt, stageVars, storyPosition, wheelTarget } from "./stage-math"

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

  it("cross-fades two pictures straight into each other, so no frame is ever empty", () => {
    for (const position of [0.25, 0.5, 1.5, 3.9]) {
      const vars = stageVars(position, 5)
      const shown = [0, 1, 2, 3, 4].reduce((sum, index) => sum + Number(vars[`--v${index}`]), 0)
      expect(shown).toBeCloseTo(1, 2)
    }
    expect(sceneAt(1.4)).toBe(1)
    expect(sceneAt(1.6)).toBe(2)
  })

  it("closes in on the map as the visitor moves from the world to their country", () => {
    expect(stageVars(0, 5)["--world-zoom"]).toBe("1.000")
    expect(stageVars(1, 5)["--world-zoom"]).toBe("8.000")
    expect(Number(stageVars(2, 5)["--area-zoom"])).toBeGreaterThan(Number(stageVars(1, 5)["--area-zoom"]))
  })
})

describe("wheelTarget", () => {
  it("moves one scene in the wheel's direction, however hard the wheel is spun", () => {
    expect(wheelTarget(0, 3, 5)).toBe(1)
    expect(wheelTarget(0, 900, 5)).toBe(1)
    expect(wheelTarget(2, -100, 5)).toBe(1)
    expect(wheelTarget(1.4, 100, 5)).toBe(2)
  })

  it("lets the page scroll on normally past the last scene and before the first", () => {
    expect(wheelTarget(4, 100, 5)).toBeNull()
    expect(wheelTarget(0, -100, 5)).toBeNull()
    expect(wheelTarget(2, 0, 5)).toBeNull()
  })
})
