import { describe, expect, it } from "vitest"
import { audienceFit, costFit, novelty, themeIsCovered, totalScore, venueFit } from "./concepts.scoring"

const overlap = (affinity: number | null) => ({
  id: "o",
  anchorId: "s1",
  targetId: "s2",
  found: affinity !== null,
  affinity,
  rank: null,
  receipt: null,
})

describe("totalScore", () => {
  it("follows the brief: 40 x audience + 20 x novelty + 20 x venue + 20 x cost", () => {
    expect(totalScore({ audienceFit: 0.9, novelty: 0.8, venueFit: 0.7, costFit: 0.6 })).toBe(78)
    expect(totalScore({ audienceFit: 1, novelty: 1, venueFit: 1, costFit: 1 })).toBe(100)
    expect(totalScore({ audienceFit: 0, novelty: 0, venueFit: 0, costFit: 0 })).toBe(0)
  })
})

describe("audienceFit", () => {
  it("averages the confirmed overlaps and counts a missing one as zero", () => {
    expect(audienceFit([overlap(0.9), overlap(0.8)])).toBe(0.85)
    expect(audienceFit([overlap(0.9), overlap(null)])).toBe(0.45)
    expect(audienceFit([])).toBe(0)
  })
})

describe("novelty", () => {
  const covered = [
    { theme: "Trivia", examples: [], count: 4 },
    { theme: "Stand-up comedy", examples: [], count: 2 },
    { theme: "Drinks, no programme", examples: [], count: 12 },
  ]

  it("matches synonyms and shared words, and ignores bars with no programme", () => {
    expect(themeIsCovered("Pub quiz", covered)).toBe(true)
    expect(themeIsCovered("Comedy open mic", covered)).toBe(true)
    expect(themeIsCovered("Natural wine and drinks", covered)).toBe(false)
    expect(
      themeIsCovered("Songwriters in the round", [{ theme: "Singer-songwriter showcase", examples: [], count: 3 }]),
    ).toBe(true)
  })

  it("is one minus the covered share, and neutral when the scan failed", () => {
    expect(novelty(["Pub quiz", "Afrobeats"], covered, false)).toBe(0.5)
    expect(novelty(["Afrobeats", "West African food"], covered, false)).toBe(1)
    expect(novelty(["Pub quiz"], covered, true)).toBe(0.5)
  })
})

describe("venueFit", () => {
  it("is the share of needs the room has, scaled for a crowd bigger than capacity", () => {
    expect(venueFit(["stage", "sound_system"], ["stage", "sound_system"], 40, 80)).toBe(1)
    expect(venueFit(["stage", "screen"], ["stage"], 40, 80)).toBe(0.5)
    expect(venueFit([], [], 160, 80)).toBe(0.5)
  })
})

describe("costFit", () => {
  it("is full within budget and falls to zero at twice the budget", () => {
    expect(costFit(30000, 40000)).toBe(1)
    expect(costFit(60000, 40000)).toBe(0.5)
    expect(costFit(80000, 40000)).toBe(0)
    expect(costFit(100000, 40000)).toBe(0)
    expect(costFit(1000, 0)).toBe(0)
    expect(costFit(0, 0)).toBe(1)
  })
})
