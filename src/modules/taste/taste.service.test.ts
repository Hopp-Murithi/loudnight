import { beforeEach, describe, expect, it, vi } from "vitest"
import { TASTE_DOMAINS } from "@/config/taste"
import { qlooInsights } from "@/lib/qloo/client"
import type { AdminSupabase } from "@/lib/supabase/admin"
import { runsRepository } from "@/modules/runs/runs.repository"
import { tasteRepository } from "./taste.repository"
import { cachedQloo, readNeighbourhood } from "./taste.service"

vi.mock("@/lib/qloo/client", () => ({ qlooInsights: vi.fn() }))
vi.mock("./taste.repository", () => ({ tasteRepository: { findCurrent: vi.fn(), store: vi.fn() } }))
vi.mock("@/modules/runs/runs.repository", () => ({
  runsRepository: { insertStep: vi.fn(async () => "step"), finishStep: vi.fn() },
}))

const admin = {} as AdminSupabase
const request = { path: "/v2/insights", params: { "filter.type": "urn:tag" } }
const future = new Date(Date.now() + 86_400_000).toISOString()
const past = new Date(Date.now() - 1_000).toISOString()
const area = { point: { latitude: 30.2624, longitude: -97.7296 }, radiusMetres: 2000 }

const synthetic = {
  _synthetic: true,
  success: true,
  results: { tags: [{ tag_id: "urn:tag:genre:music:synthetic", name: "Synthetic", query: { affinity: 0.9 } }] },
}
const fresh = { requestHash: "h", request: { path: "/v2/insights", params: {} }, response: synthetic }

beforeEach(() => {
  vi.mocked(qlooInsights).mockReset()
  vi.mocked(tasteRepository.findCurrent).mockReset()
  vi.mocked(tasteRepository.store).mockReset()
  vi.mocked(runsRepository.insertStep).mockClear()
  vi.mocked(runsRepository.finishStep).mockClear()
})

describe("cachedQloo", () => {
  it("answers from a fresh cached row without calling Qloo", async () => {
    vi.mocked(tasteRepository.findCurrent).mockResolvedValue({ id: "cache-1", response: synthetic, expiresAt: future })
    const answer = await cachedQloo(admin, request)
    expect(answer).toMatchObject({ cacheId: "cache-1", fromCache: true })
    expect(qlooInsights).not.toHaveBeenCalled()
  })

  it("asks Qloo again when the row has expired, and stores the new answer", async () => {
    vi.mocked(tasteRepository.findCurrent).mockResolvedValue({ id: "old", response: synthetic, expiresAt: past })
    vi.mocked(qlooInsights).mockResolvedValue(fresh)
    vi.mocked(tasteRepository.store).mockResolvedValue("new")
    const answer = await cachedQloo(admin, request)
    expect(answer).toMatchObject({ cacheId: "new", fromCache: false })
    expect(tasteRepository.store).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({ endpoint: "/v2/insights", ttlDays: 7 }),
    )
  })

  it("reads the winner's row when a concurrent store of the same request won", async () => {
    vi.mocked(tasteRepository.findCurrent)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "winner", response: synthetic, expiresAt: future })
    vi.mocked(qlooInsights).mockResolvedValue(fresh)
    vi.mocked(tasteRepository.store).mockResolvedValue(null)
    await expect(cachedQloo(admin, request)).resolves.toMatchObject({ cacheId: "winner" })
  })
})

describe("readNeighbourhood", () => {
  it("keeps every domain, marking the ones that failed", async () => {
    vi.mocked(tasteRepository.findCurrent).mockResolvedValue(null)
    vi.mocked(tasteRepository.store).mockResolvedValue("00000000-0000-4000-8000-000000000002")
    vi.mocked(qlooInsights).mockImplementation(async (call) => {
      if (call.params["filter.type"] === "urn:entity:book") throw new Error("Qloo down")
      return fresh
    })
    const fingerprint = await readNeighbourhood(admin, area)
    expect(fingerprint.domains).toHaveLength(TASTE_DOMAINS.length)
    expect(fingerprint.domains.find((domain) => domain.domain === "books")?.status).toBe("failed")
    expect(fingerprint.domains.find((domain) => domain.domain === "music_styles")?.status).toBe("ok")
  })

  it("writes a trace row per Qloo call with the cache id when a run is given", async () => {
    vi.mocked(tasteRepository.findCurrent).mockResolvedValue({ id: "cache-9", response: synthetic, expiresAt: future })
    await readNeighbourhood(admin, area, { admin, runId: "r", venueId: "v", step: "read_neighbourhood" })
    expect(runsRepository.insertStep).toHaveBeenCalledTimes(TASTE_DOMAINS.length + 1)
    expect(runsRepository.finishStep).toHaveBeenCalledWith(
      admin,
      "step",
      expect.objectContaining({ status: "succeeded", qloo_cache_id: "cache-9" }),
    )
  })
})
