import { describe, expect, it } from "vitest"
import { nextEvenings, ticketmasterTime, zonedInstant } from "./gap.weekdays"

const NEW_YORK = "America/New_York"
const CHICAGO = "America/Chicago"

describe("zonedInstant", () => {
  it("reads 5 pm in New York as 21:00 UTC in summer and 22:00 UTC in winter", () => {
    expect(zonedInstant(2026, 7, 14, 17, NEW_YORK).toISOString()).toBe("2026-07-14T21:00:00.000Z")
    expect(zonedInstant(2026, 12, 15, 17, NEW_YORK).toISOString()).toBe("2026-12-15T22:00:00.000Z")
  })

  it("puts Chicago an hour behind New York", () => {
    expect(zonedInstant(2026, 7, 14, 17, CHICAGO).toISOString()).toBe("2026-07-14T22:00:00.000Z")
  })
})

describe("nextEvenings", () => {
  it("gives four Tuesdays, 5 pm to 2 am local, in a plain week", () => {
    const evenings = nextEvenings("tuesday", NEW_YORK, new Date("2026-10-13T12:00:00Z"))
    expect(evenings.map((evening) => evening.localDate)).toEqual([
      "2026-10-13",
      "2026-10-20",
      "2026-10-27",
      "2026-11-03",
    ])
    expect(evenings[0].start.toISOString()).toBe("2026-10-13T21:00:00.000Z")
    expect(evenings[0].end.toISOString()).toBe("2026-10-14T06:00:00.000Z")
  })

  it("keeps 5 pm local across the end of daylight saving (Nov 1, 2026)", () => {
    const [, , before, after] = nextEvenings("tuesday", NEW_YORK, new Date("2026-10-13T12:00:00Z"))
    expect(before.start.toISOString()).toBe("2026-10-27T21:00:00.000Z")
    expect(after.start.toISOString()).toBe("2026-11-03T22:00:00.000Z")
  })

  it("keeps 5 pm local across the start of daylight saving (Mar 8, 2026)", () => {
    const [before, after] = nextEvenings("tuesday", NEW_YORK, new Date("2026-03-01T12:00:00Z"), 2)
    expect(before.start.toISOString()).toBe("2026-03-03T22:00:00.000Z")
    expect(after.start.toISOString()).toBe("2026-03-10T21:00:00.000Z")
  })

  it("uses the venue's own date, not UTC's, late in the evening", () => {
    const evenings = nextEvenings("wednesday", CHICAGO, new Date("2026-10-14T03:30:00Z"), 1)
    expect(evenings[0].localDate).toBe("2026-10-14")
  })
})

describe("ticketmasterTime", () => {
  it("drops the milliseconds", () => {
    expect(ticketmasterTime(new Date("2026-10-13T21:00:00.000Z"))).toBe("2026-10-13T21:00:00Z")
  })
})
