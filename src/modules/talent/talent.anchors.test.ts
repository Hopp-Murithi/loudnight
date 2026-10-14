import { describe, expect, it } from "vitest"
import type { QlooInsights } from "@/lib/qloo/schemas"
import type { RunContext } from "@/modules/runs/runs.schemas"
import { actReceiptPath, actsFrom, conceptAnchors, localSoundAnchors, messageTastes } from "./talent.anchors"

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

describe("messageTastes", () => {
  it("mentions the music a crowd likes, not the films or brands it also follows", () => {
    const anchors = conceptAnchors("Renamed", {
      fingerprint,
      invention: { candidates: [candidate("Renamed", ["s1", "s3"])], overlaps: [], turns: 1, toolCalls: 0 },
    })
    expect(anchors.map((anchor) => anchor.name)).toEqual(["Sample soul", "Sample film"])
    expect(messageTastes(anchors)).toEqual(["Sample soul"])
  })

  it("uses every taste when none of them is music or a kind of night out", () => {
    const anchors = conceptAnchors("Film Night", {
      fingerprint,
      invention: { candidates: [candidate("Film Night", ["s3"])], overlaps: [], turns: 1, toolCalls: 0 },
    })
    expect(messageTastes(anchors)).toEqual(["Sample film"])
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

describe("localSoundAnchors", () => {
  it("picks the music styles named after the venue's country", () => {
    const local: RunContext["fingerprint"] = {
      domains: [
        {
          domain: "music_styles",
          label: "Music styles",
          status: "ok",
          items: [item("t1", "Kenyan"), item("t2", "Bongo flava"), item("t3", "Kenya gospel")],
        },
      ],
      audience: null,
    }
    expect(localSoundAnchors({ fingerprint: local }, "Kenya").map((anchor) => anchor.name)).toEqual([
      "Kenyan",
      "Kenya gospel",
    ])
    expect(localSoundAnchors({ fingerprint: local }, "Nigeria")).toEqual([])
    expect(localSoundAnchors({}, "Kenya")).toEqual([])
  })
})
