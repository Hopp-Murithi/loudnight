import { describe, expect, it } from "vitest"
import { hasDigits, instantFor, localParts, nightSlug, seriesNights } from "./series.dates"

describe("seriesNights", () => {
  it("starts next week, never tonight, at eight in the venue's own zone", () => {
    const tuesdayNoon = new Date("2026-10-13T16:00:00Z")
    const nights = seriesNights("tuesday", "America/New_York", tuesdayNoon)
    expect(nights.map((night) => night.localDate)).toEqual(["2026-10-20", "2026-10-27", "2026-11-03", "2026-11-10"])
    expect(nights[0].startsAt.toISOString()).toBe("2026-10-21T00:00:00.000Z")
  })

  it("keeps eight o'clock on the wall when the clocks change part way through", () => {
    const nights = seriesNights("tuesday", "America/New_York", new Date("2026-10-13T16:00:00Z"))
    expect(nights[1].startsAt.toISOString()).toBe("2026-10-28T00:00:00.000Z")
    expect(nights[2].startsAt.toISOString()).toBe("2026-11-04T01:00:00.000Z")
  })
})

describe("instantFor and localParts", () => {
  it("round trip a date and time through the venue's zone", () => {
    const instant = instantFor("2026-11-03", "19:30", "America/Chicago")
    expect(instant.toISOString()).toBe("2026-11-04T01:30:00.000Z")
    expect(localParts(instant, "America/Chicago")).toEqual({ date: "2026-11-03", time: "19:30" })
  })
})

describe("nightSlug", () => {
  const id = "3fa94c1e-2c1b-4c55-9d2e-0b7a3c1e0001"

  it("reads as the night, the day and a short ending from the concept", () => {
    expect(nightSlug("Low Light Tuesdays", "2026-10-20", id)).toBe("low-light-tuesdays-tue-oct-20-3fa9")
  })

  it("fits the database pattern whatever the name holds", () => {
    const slug = nightSlug("  Cafe & Jazz!! A very long name that keeps going on and on and on  ", "2026-10-20", id)
    expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    expect(slug.length).toBeLessThanOrEqual(80)
    expect(nightSlug("!!!", "2026-10-20", id)).toBe("night-tue-oct-20-3fa9")
  })

  it("differs between two concepts with the same name on the same day", () => {
    expect(nightSlug("Same", "2026-10-20", id)).not.toBe(nightSlug("Same", "2026-10-20", "aaaa" + id.slice(4)))
  })
})

describe("hasDigits", () => {
  it("spots any number the copywriter slipped in", () => {
    expect(hasDigits("Doors at 8")).toBe(true)
    expect(hasDigits("Bring a friend for the finale")).toBe(false)
  })
})
