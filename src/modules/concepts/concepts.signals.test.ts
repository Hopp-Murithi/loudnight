import { describe, expect, it } from "vitest"
import type { TasteFingerprint } from "@/modules/taste/taste.schemas"
import { buildSignals, readOverlap, signalsForModel } from "./concepts.signals"

const CACHE = "00000000-0000-4000-8000-000000000001"
const receipt = { cacheId: CACHE, path: ["results", "tags", "0", "query", "affinity"] }
const item = (id: string, name: string) => ({ id, name, affinity: 0.99, score: 1, popularity: null, receipt })

const fingerprint: TasteFingerprint = {
  domains: [
    {
      domain: "music_styles",
      label: "Music styles",
      status: "ok",
      items: [item("urn:tag:genre:music:sample", "Sample")],
    },
    { domain: "places", label: "Places nearby", status: "ok", items: [item("PLACE-1", "A rival bar")] },
    { domain: "film", label: "Films", status: "ok", items: [item("FILM-1", "Sample Film")] },
    { domain: "books", label: "Books", status: "failed", items: [] },
  ],
  audience: null,
}

describe("buildSignals", () => {
  it("numbers every taste except nearby places, and remembers how to ask Qloo about it", () => {
    const signals = buildSignals(fingerprint)
    expect(signals.map((signal) => [signal.id, signal.category, signal.kind])).toEqual([
      ["s1", "music", "tag"],
      ["s2", "film", "entity"],
    ])
    expect(signals[1].qlooType).toBe("urn:entity:movie")
  })

  it("shows the model names and ids, never numbers", () => {
    expect(JSON.stringify(signalsForModel(buildSignals(fingerprint)))).not.toMatch(/0\.99|affinity/)
  })
})

describe("readOverlap", () => {
  const target = buildSignals(fingerprint)[0]

  it("finds the target and points the receipt at its affinity", () => {
    const response = {
      _synthetic: true,
      results: {
        tags: [
          { tag_id: "urn:tag:other", name: "Other", query: { affinity: 0.9 } },
          { tag_id: target.qlooId, name: "Sample", query: { affinity: 0.81 } },
        ],
      },
    }
    expect(readOverlap(response, CACHE, { id: "o1", anchorId: "s2", target })).toMatchObject({
      found: true,
      affinity: 0.81,
      rank: 2,
      receipt: { cacheId: CACHE, path: ["results", "tags", "1", "query", "affinity"] },
    })
  })

  it("reports a target Qloo did not return as not found, with no receipt", () => {
    expect(readOverlap({ results: { tags: [] } }, CACHE, { id: "o1", anchorId: "s2", target })).toMatchObject({
      found: false,
      receipt: null,
    })
  })
})
