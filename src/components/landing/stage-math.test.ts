import { describe, expect, it } from "vitest"
import { easeInOut, keyTarget, sceneAt, stageVars, stepTarget, SWIPE_PX, swipeStep } from "./stage-math"

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

describe("stepTarget", () => {
  it("moves exactly one scene per gesture, however hard the wheel is spun", () => {
    expect(stepTarget(0, 3, 5)).toBe(1)
    expect(stepTarget(0, 900, 5)).toBe(1)
    expect(stepTarget(2, -100, 5)).toBe(1)
  })

  it("chains fast gestures one scene at a time from where the story is heading", () => {
    let scene = 0
    for (let flick = 0; flick < 3; flick += 1) scene = stepTarget(scene, 1, 5) ?? scene
    expect(scene).toBe(3)
  })

  it("lets the page scroll on normally past the last scene and before the first", () => {
    expect(stepTarget(4, 100, 5)).toBeNull()
    expect(stepTarget(0, -100, 5)).toBeNull()
    expect(stepTarget(2, 0, 5)).toBeNull()
  })
})

describe("swipeStep", () => {
  it("ignores a tap or a wobble", () => {
    expect(swipeStep(500, 500)).toBe(0)
    expect(swipeStep(500, 500 - SWIPE_PX + 1)).toBe(0)
  })

  it("reads a swipe up the screen as the next scene and down as the one before", () => {
    expect(swipeStep(500, 300)).toBe(1)
    expect(swipeStep(300, 700)).toBe(-1)
  })
})

describe("the glide between scenes", () => {
  it("starts and ends still, and is halfway at the middle", () => {
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(0.5)).toBe(0.5)
    expect(easeInOut(1)).toBe(1)
    expect(easeInOut(0.1)).toBeLessThan(0.1)
    expect(easeInOut(0.9)).toBeGreaterThan(0.9)
  })

  it("moves one scene per key, and lets the page scroll on past either end", () => {
    expect(keyTarget(1, "ArrowDown", 5)).toBe(2)
    expect(keyTarget(1, "PageUp", 5)).toBe(0)
    expect(keyTarget(0, "ArrowUp", 5)).toBeNull()
    expect(keyTarget(4, " ", 5)).toBeNull()
    expect(keyTarget(2, "Enter", 5)).toBeNull()
  })
})
