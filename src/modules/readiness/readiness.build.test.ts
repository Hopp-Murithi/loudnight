import { describe, expect, it } from "vitest"
import { buildReadiness, checklistSchema, type ReadinessInput } from "./readiness.build"

const base: ReadinessInput = {
  venueId: "v1",
  conceptName: "Sample Night",
  needs: ["stage", "sound_system"],
  capabilities: ["stage", "sound_system", "kitchen"],
  costCents: 20000,
  currency: "USD",
  budgetCents: 35000,
  hasSeries: false,
  bookedCount: 0,
  shortlistCount: 0,
  adSaved: false,
  logisticsDone: [],
}
const step = (input: ReadinessInput, id: string) => buildReadiness(input).steps.find((item) => item.id === id)

describe("buildReadiness", () => {
  it("starts with the choice made and everything else to do, each pointing at where to do it", () => {
    const ready = buildReadiness(base)
    expect(ready.steps.filter((item) => item.done).map((item) => item.id)).toEqual(["night", "room", "budget"])
    expect(step(base, "series")?.href).toBe("/venues/v1/series")
    expect(step(base, "ad")?.href).toBe("/venues/v1/promote")
    expect([ready.done, ready.total]).toEqual([3, 11])
  })

  it("counts the series, a booking, the ad and ticked logistics as they happen", () => {
    const ready = buildReadiness({
      ...base,
      hasSeries: true,
      bookedCount: 1,
      shortlistCount: 8,
      adSaved: true,
      logisticsDone: ["staff", "door"],
    })
    expect(ready.steps.every((item) => item.done)).toBe(true)
    expect(ready.logistics.filter((item) => item.done).map((item) => item.id)).toEqual(["staff", "door"])
    expect(ready.done).toBe(8)
    expect(step({ ...base, bookedCount: 1 }, "act")?.hint).toBe("1 act said yes")
  })

  it("nudges toward the shortlist when acts are found but nobody is booked", () => {
    expect(step({ ...base, shortlistCount: 8 }, "act")?.hint).toBe("8 performers on your shortlist. Message one.")
  })

  it("names what the room is missing for this night", () => {
    const missing = step({ ...base, needs: ["stage", "dance_floor", "screen"] }, "room")
    expect(missing?.done).toBe(false)
    expect(missing?.hint).toBe("This night needs dance floor and screen")
  })

  it("flags a night that costs more than the talent budget, with both figures", () => {
    const over = step({ ...base, costCents: 50000 }, "budget")
    expect(over?.done).toBe(false)
    expect(over?.hint).toContain("About $500 a night against a $350 budget")
  })

  it("ignores a ticked item it does not know", () => {
    expect(buildReadiness({ ...base, logisticsDone: ["made-up"] }).logistics.some((item) => item.done)).toBe(false)
  })
})

describe("checklistSchema", () => {
  it("accepts known items and refuses anything else", () => {
    expect(checklistSchema.safeParse({ done: ["staff", "payments"] }).success).toBe(true)
    expect(checklistSchema.safeParse({ done: ["made-up"] }).success).toBe(false)
  })
})
