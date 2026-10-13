import { afterEach, describe, expect, it, vi } from "vitest"
import type { AdminSupabase } from "@/lib/supabase/admin"
import { runsRepository } from "./runs.repository"
import { recordStep } from "./runs.steps"

vi.mock("./runs.repository", () => ({ runsRepository: { insertStep: vi.fn(), finishStep: vi.fn() } }))

const admin = {} as AdminSupabase

afterEach(() => {
  vi.useRealTimers()
})

describe("recordStep", () => {
  it("opens a running row, then closes it with latency and the cache id", async () => {
    vi.useFakeTimers()
    vi.mocked(runsRepository.insertStep).mockResolvedValue("step-1")
    const finish = await recordStep(
      { admin, runId: "run", venueId: "venue", step: "read_neighbourhood" },
      "qloo.insights",
      { label: "music" },
    )
    expect(runsRepository.insertStep).toHaveBeenCalledWith(admin, expect.objectContaining({ tool: "qloo.insights" }))

    vi.advanceTimersByTime(250)
    await finish({ ok: true, summary: { label: "music" }, cacheId: "cache-1" })
    expect(runsRepository.finishStep).toHaveBeenCalledWith(
      admin,
      "step-1",
      expect.objectContaining({ status: "succeeded", qloo_cache_id: "cache-1", latency_ms: 250 }),
    )
  })

  it("marks a failed call", async () => {
    vi.mocked(runsRepository.insertStep).mockResolvedValue("step-2")
    const finish = await recordStep(
      { admin, runId: "run", venueId: "venue", step: "read_neighbourhood" },
      "qloo.insights",
      {},
    )
    await finish({ ok: false, summary: {} })
    expect(runsRepository.finishStep).toHaveBeenCalledWith(
      admin,
      "step-2",
      expect.objectContaining({ status: "failed" }),
    )
  })
})
