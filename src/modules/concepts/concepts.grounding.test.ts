import { describe, expect, it } from "vitest"
import { formatAffinity, groundCandidate } from "./concepts.grounding"
import type { Candidate } from "./concepts.schemas"
import type { OverlapResult, Signal } from "./concepts.signals"

const CACHE = "00000000-0000-4000-8000-000000000001"
const receipt = (index: number) => ({ cacheId: CACHE, path: ["results", "tags", String(index), "query", "affinity"] })

const signal = (id: string, category: Signal["category"], affinity: number, index: number): Signal => ({
  id,
  domain: category === "music" ? "music_styles" : "place_styles",
  category,
  name: "Sample",
  kind: "tag",
  qlooId: `urn:tag:sample:${id}`,
  qlooType: "urn:tag:genre:music",
  affinity,
  receipt: receipt(index),
})

const signals = new Map([
  ["s1", signal("s1", "music", 0.98, 0)],
  ["s2", signal("s2", "night_out", 0.97, 1)],
  ["s3", signal("s3", "music", 0.95, 2)],
])

const overlaps = new Map<string, OverlapResult>([
  ["o1", { id: "o1", anchorId: "s1", targetId: "s2", found: true, affinity: 0.854, rank: 3, receipt: receipt(7) }],
  ["o2", { id: "o2", anchorId: "s1", targetId: "s3", found: false, affinity: null, rank: null, receipt: null }],
])

const base: Candidate = {
  name: "Sample Night",
  pitch: "A sample night for the tests.",
  reasonBeatsNearby: "Nothing nearby runs it.",
  signalIds: ["s1", "s2"],
  overlapIds: ["o1"],
  claims: [
    { label: "Sample soul is big nearby", source: "s1" },
    { label: "Its fans also love sample food", source: "o1" },
  ],
  format: "live_music",
  needs: ["stage"],
  themes: ["Sample music"],
  expectedAudience: 40,
  estimatedCostCents: 30000,
}

describe("groundCandidate", () => {
  it("keeps claims whose receipts hold their values", () => {
    const { grounded, dropped } = groundCandidate(base, signals, overlaps)
    expect(dropped).toEqual([])
    expect(grounded?.claims.map((claim) => claim.value)).toEqual([0.98, 0.854])
    expect(grounded?.claims[1].receipt.path).toEqual(["results", "tags", "7", "query", "affinity"])
  })

  it("drops a made-up number, keeping the claim only when the number matches its receipt", () => {
    const candidate = {
      ...base,
      claims: [
        ...base.claims,
        { label: "Fans love it 3.4 times more", source: "o1" },
        { label: "Affinity 0.85 with its fans", source: "o1" },
      ],
    }
    const { grounded, dropped } = groundCandidate(candidate, signals, overlaps)
    expect(dropped).toEqual([{ label: "Fans love it 3.4 times more", reason: "number not in receipt" }])
    expect(grounded?.claims).toHaveLength(3)
    expect(formatAffinity(0.854)).toBe("0.85")
  })

  it("does not mistake digits in a taste's own name for a claim", () => {
    const named = new Map(signals)
    named.set("s2", { ...signal("s2", "night_out", 0.97, 1), name: "2 Sample Queens" })
    const candidate = { ...base, claims: [...base.claims, { label: "2 Sample Queens fans love it", source: "o1" }] }
    expect(groundCandidate(candidate, named, overlaps).dropped).toEqual([])
  })

  it("drops a claim that cites an overlap Qloo did not confirm, or a source that does not exist", () => {
    const candidate = {
      ...base,
      claims: [...base.claims, { label: "Unconfirmed", source: "o2" }, { label: "Ghost", source: "s9" }],
    }
    expect(groundCandidate(candidate, signals, overlaps).dropped).toEqual([
      { label: "Unconfirmed", reason: "no receipt" },
      { label: "Ghost", reason: "unknown source" },
    ])
  })

  it("rejects a candidate left with fewer than two claims", () => {
    const candidate = { ...base, claims: [base.claims[0], { label: "Unconfirmed", source: "o2" }] }
    expect(groundCandidate(candidate, signals, overlaps)).toMatchObject({ grounded: null, rejected: "too few claims" })
  })

  it("rejects a candidate built from one domain only", () => {
    expect(groundCandidate({ ...base, signalIds: ["s1", "s3"] }, signals, overlaps)).toMatchObject({
      grounded: null,
      rejected: "one domain only",
    })
  })
})
