import { describe, expect, it } from "vitest"
import { nightEditSchema, outreachEditSchema, variationsSchema } from "./series.schemas"

const four = [
  "Opening night with a welcome drink for early arrivals.",
  "A guest act joins for a second set.",
  "The kitchen runs a special to match the night.",
  "Regulars bring a friend for the finale.",
]

describe("variationsSchema", () => {
  it("accepts four distinct twists", () => {
    expect(variationsSchema.safeParse({ variations: four }).success).toBe(true)
  })

  it("rejects a twist that states a number, because Encore fills those in itself", () => {
    const withNumber = [...four.slice(0, 3), "Doors at 8 for the finale with half price drinks."]
    expect(variationsSchema.safeParse({ variations: withNumber }).success).toBe(false)
  })

  it("rejects three weeks, five weeks, or the same twist twice", () => {
    expect(variationsSchema.safeParse({ variations: four.slice(0, 3) }).success).toBe(false)
    expect(variationsSchema.safeParse({ variations: [...four, four[0]] }).success).toBe(false)
    expect(variationsSchema.safeParse({ variations: [four[0], four[0], four[2], four[3]] }).success).toBe(false)
  })

  it("replaces long dashes the copywriter used", () => {
    const dash = String.fromCharCode(0x2014)
    const parsed = variationsSchema.parse({
      variations: [`Opening night ${dash} the full idea, start to finish.`, ...four.slice(1)],
    })
    expect(parsed.variations[0]).toBe("Opening night, the full idea, start to finish.")
  })
})

describe("nightEditSchema", () => {
  const good = { date: "2026-10-27", time: "19:30", variation: "A guest act joins." }

  it("accepts a real date, a real time and a twist", () => {
    expect(nightEditSchema.safeParse(good).success).toBe(true)
  })

  it("rejects a bad date, an impossible time and an empty twist", () => {
    expect(nightEditSchema.safeParse({ ...good, date: "27/10/2026" }).success).toBe(false)
    expect(nightEditSchema.safeParse({ ...good, time: "25:00" }).success).toBe(false)
    expect(nightEditSchema.safeParse({ ...good, variation: "   " }).success).toBe(false)
  })
})

describe("outreachEditSchema", () => {
  it("needs a message that is not blank", () => {
    expect(outreachEditSchema.safeParse({ message: "  " }).success).toBe(false)
    expect(outreachEditSchema.safeParse({ message: "Hello, are you free?" }).success).toBe(true)
  })
})
