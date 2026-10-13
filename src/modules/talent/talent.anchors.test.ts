import { describe, expect, it } from "vitest"
import type { QlooInsights } from "@/lib/qloo/schemas"
import type { RunContext } from "@/modules/runs/runs.schemas"
import { actReceiptPath, actsFrom, conceptAnchors } from "./talent.anchors"

// Made-up values in the shape the pipeline stores. Never real Qloo data.
const receipt = { cacheId: "00000000-0000-4000-8000-000000000000", path: ["results", "tags", "0", "query", "affinity"] }
const item = (id: string, name: string) => ({ id, name, affinity: 0.9, score: 1, popularity: null, receipt })
const fingerprint: RunContext["fingerprint"] = {
  domains: [
    {
      domain: "music_styles",
      label: "Music styles",
      status: "ok",
      items: [item("t1", "Sample soul"), item("t2", "Sample folk")],
    },
    { domain: "film", label: "Films", status: "ok", items: [item("e1", "Sample film")] },
  ],
  audience: null,
}
const candidate = (name: string, signalIds: string[]) =>
  ({ name, signalIds }) as NonNullable<RunContext["invention"]>["candidates"][number]

describe("conceptAnchors", () => {
  it("uses the tastes the chosen night was built on", () => {
    const context: RunContext = {
      fingerprint,
      invention: { candidates: [candidate("Sample Night", ["s2", "s3"])], overlaps: [], turns: 1, toolCalls: 0 },
    }
    expect(conceptAnchors("Sample Night", context).map((anchor) => anchor.name)).toEqual(["Sample folk", "Sample film"])
  })

  it("falls back to the area's leading music styles when the plan no longer names the night", () => {
    expect(conceptAnchors("Renamed", { fingerprint }).map((anchor) => anchor.qlooId)).toEqual(["t1", "t2"])
  })

  it("has nothing to offer without a fingerprint", () => {
    expect(conceptAnchors("Sample Night", {})).toEqual([])
  })
})

describe("actsFrom", () => {
  const response: QlooInsights = {
    _synthetic: true,
    results: {
      entities: [
        { entity_id: "a", name: "Sample Act", popularity: 0.5, query: { affinity: 0.91 } },
        { entity_id: "b", name: "No affinity" },
        { entity_id: "c", name: "Quiet Act", popularity: null, query: { affinity: 0.8 } },
      ],
    },
  }

  it("keeps acts with an affinity, and remembers where each sits so its receipt can point there", () => {
    const acts = actsFrom(response)
    expect(acts.map((act) => [act.entityId, act.index, act.popularity])).toEqual([
      ["a", 0, 0.5],
      ["c", 2, null],
    ])
    expect(actReceiptPath(acts[1].index)).toEqual(["results", "entities", "2", "query", "affinity"])
  })

  it("is empty for an empty answer", () => {
    expect(actsFrom({ results: {} })).toEqual([])
  })
})
