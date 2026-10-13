import { describe, expect, it } from "vitest"
import { NIGHT_VALUE_DEFAULTS } from "@/config/landing"
import { nightValue } from "./night-value"

describe("nightValue", () => {
  it("matches the brief's example: 30 guests at $20 on four Tuesdays is $2,400", () => {
    expect(nightValue(NIGHT_VALUE_DEFAULTS)).toEqual({ monthly: 2400, timesPlan: 24 })
  })

  it("rounds the plan multiple down so the page never overstates it", () => {
    expect(nightValue({ guests: 5, spend: 5, nightsPerMonth: 4 })).toEqual({ monthly: 100, timesPlan: 1 })
  })

  it("treats negative inputs as zero", () => {
    expect(nightValue({ guests: -10, spend: 20, nightsPerMonth: 4 })).toEqual({ monthly: 0, timesPlan: 0 })
  })
})
