import { describe, expect, it } from "vitest"
import {
  formatClock,
  currencyName,
  formatLocalDate,
  formatMoney,
  formatNightDate,
  formatNightTime,
  formatPercent,
  plural,
} from "./format"

describe("format", () => {
  it("shows money in whole units of the venue's own currency", () => {
    expect(formatMoney(240_000, "USD")).toBe("$2,400")
    expect(formatMoney(1_999, "USD")).toBe("$20")
    expect(formatMoney(500_000, "KES")).toBe("KES 5,000")
    expect(formatMoney(4_000, "GBP")).toBe("£40")
    expect(formatMoney(4_000, "EUR")).toBe("€40")
    expect(formatMoney(300_000, "JPY")).toBe("¥3,000")
  })

  it("names a currency in words", () => {
    expect(currencyName("KES")).toBe("Kenyan Shilling")
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

describe("formatLocalDate", () => {
  it("keeps the calendar day whatever the server's zone", () => {
    expect(formatLocalDate("2026-10-13", { weekday: "short", month: "short", day: "numeric" })).toBe("Tue, Oct 13")
  })
})

describe("formatClock", () => {
  it("shows the time in the venue's zone, whatever the machine's clock says", () => {
    expect(formatClock("2026-10-22T01:20:00Z", "America/Chicago")).toBe("8:20 PM")
    expect(formatClock("2026-10-22T01:20:00Z", "Africa/Nairobi")).toBe("4:20 AM")
  })
})
