import { describe, expect, it } from "vitest"
import { formatMoney, formatNightDate, formatNightTime, formatPercent, plural } from "./format"

describe("format", () => {
  it("shows money in whole dollars", () => {
    expect(formatMoney(240_000)).toBe("$2,400")
    expect(formatMoney(1_999)).toBe("$20")
  })

  // A Tuesday 8pm night in Brooklyn is still Tuesday 8pm, whatever the server's clock says.
  it("shows a night in the venue's time zone", () => {
    const iso = "2026-10-21T00:00:00Z"
    expect(formatNightDate(iso, "America/New_York")).toBe("Tue, Oct 20")
    expect(formatNightTime(iso, "America/New_York")).toBe("8:00 PM EDT")
  })

  it("shows ratios as whole percentages", () => {
    expect(formatPercent(0.856)).toBe("86%")
  })

  it("pluralises counts", () => {
    expect(plural(1, "guest")).toBe("1 guest")
    expect(plural(3, "guest")).toBe("3 guests")
  })
})
