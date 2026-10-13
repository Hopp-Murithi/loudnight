import { describe, expect, it } from "vitest"
import { describeTool, toToolLine } from "./runs.describe"

describe("describeTool", () => {
  it("names each call in plain words", () => {
    expect(describeTool("qloo.insights", {}, { label: "music_styles" })).toBe("What people nearby love: music styles")
    expect(describeTool("qloo.insights", {}, { label: "audience" })).toMatch(/by age and gender/)
    expect(describeTool("qloo.overlap", { anchor: "Americana", target: "Tex-Mex" }, {})).toBe(
      "Do fans of Americana also love Tex-Mex?",
    )
    expect(describeTool("places.nearby", {}, { count: 20 })).toBe("20 venues competing nearby")
  })
})

describe("toToolLine", () => {
  it("carries the source, the cache hit and whether a receipt exists", () => {
    const line = toToolLine({
      id: "s1",
      tool: "qloo.insights",
      status: "succeeded",
      input: {},
      output_summary: { label: "film", fromCache: true },
      qloo_cache_id: "c1",
      latency_ms: 210,
    })
    expect(line).toMatchObject({ source: "Qloo", ok: true, fromCache: true, hasReceipt: true, latencyMs: 210 })
  })
})
