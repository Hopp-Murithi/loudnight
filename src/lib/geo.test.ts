import { describe, expect, it } from "vitest"
import { distanceMetres, formatDistance } from "./geo"

describe("distanceMetres", () => {
  it("is zero for the same point", () => {
    expect(distanceMetres({ latitude: 40.7, longitude: -73.9 }, { latitude: 40.7, longitude: -73.9 })).toBe(0)
  })

  it("measures about 1.1 km for 0.01 degrees of latitude", () => {
    const metres = distanceMetres({ latitude: 40.7, longitude: -73.9 }, { latitude: 40.71, longitude: -73.9 })
    expect(metres).toBeGreaterThan(1100)
    expect(metres).toBeLessThan(1120)
  })
})

describe("formatDistance", () => {
  it.each([
    [0, "0 m"],
    [347, "350 m"],
    [999, "1000 m"],
    [1000, "1.0 km"],
    [1449, "1.4 km"],
  ])("%d metres reads %s", (metres, text) => {
    expect(formatDistance(metres)).toBe(text)
  })
})
