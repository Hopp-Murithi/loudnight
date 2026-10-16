import { describe, expect, it } from "vitest"
import { doorWindow } from "./door.window"

// A night at 8 PM in Chicago on Oct 20, which is 01:00 on Oct 21 in UTC.
const startsAt = "2026-10-21T01:00:00Z"
const chicago = "America/Chicago"

describe("doorWindow", () => {
  it("is closed on the days before the night, judged in the venue's own time", () => {
    expect(doorWindow(startsAt, chicago, new Date("2026-10-19T23:00:00Z"))).toBe("early")
    expect(doorWindow(startsAt, chicago, new Date("2026-10-20T04:59:00Z"))).toBe("early")
  })

  it("opens at the start of the night's day and stays open until eight hours after it begins", () => {
    expect(doorWindow(startsAt, chicago, new Date("2026-10-20T05:00:00Z"))).toBe("open")
    expect(doorWindow(startsAt, chicago, new Date("2026-10-21T09:00:00Z"))).toBe("open")
  })

  it("is over after that, so a ticket cannot be used the next day", () => {
    expect(doorWindow(startsAt, chicago, new Date("2026-10-21T09:01:00Z"))).toBe("over")
    expect(doorWindow(startsAt, chicago, new Date("2026-10-22T01:00:00Z"))).toBe("over")
  })
})
