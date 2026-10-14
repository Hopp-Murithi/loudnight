import { describe, expect, it } from "vitest"
import { fitActs, kindsFor, type Verdict } from "./talent.fit"

const acts = [
  "Sample Tanzanian Star",
  "Sample Nairobi Band",
  "Sample Preacher",
  "Sample Unknown",
  "Sample Nigerian Act",
].map((name) => ({ name }))

const verdicts = new Map<string, Verdict>([
  ["Sample Tanzanian Star", { home: "TZ", star: true, kind: "musician" }],
  ["Sample Nairobi Band", { home: "KE", star: false, kind: "musician" }],
  ["Sample Preacher", { home: "US", star: true, kind: "other" }],
  ["Sample Unknown", { home: null, star: false, kind: "musician" }],
  ["Sample Nigerian Act", { home: "NG", star: false, kind: "musician" }],
])

describe("fitActs", () => {
  it("drops stars and non-performers, then puts home-grown acts first and foreign acts last", () => {
    expect(fitActs(acts, verdicts, "KE", "live_music", 10)).toEqual([
      { name: "Sample Nairobi Band", home: "KE" },
      { name: "Sample Unknown", home: null },
      { name: "Sample Nigerian Act", home: "NG" },
    ])
  })

  it("keeps only the kind of act the night books", () => {
    const comic = new Map<string, Verdict>([["Sample Nairobi Band", { home: "KE", star: false, kind: "comedian" }]])
    expect(fitActs([{ name: "Sample Nairobi Band" }], comic, "KE", "live_music", 5)).toEqual([])
    expect(fitActs([{ name: "Sample Nairobi Band" }], comic, "KE", "other", 5)).toHaveLength(1)
  })

  it("keeps the order it was given when the check could not answer, and stops at the limit", () => {
    expect(fitActs(acts, new Map(), "KE", "live_music", 2).map((act) => act.name)).toEqual([
      "Sample Tanzanian Star",
      "Sample Nairobi Band",
    ])
    expect(fitActs(acts, verdicts, "KE", "live_music", 1)).toHaveLength(1)
  })

  it("books musicians for music, DJs or musicians for a DJ night, and any live performer otherwise", () => {
    expect(kindsFor("live_music")).toEqual(["musician"])
    expect(kindsFor("dj_night")).toEqual(["dj", "musician"])
    expect(kindsFor("game")).not.toContain("other")
  })
})
