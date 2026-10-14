import { beforeEach, describe, expect, it, vi } from "vitest"
import type { RequestContext } from "@/modules/auth/types"

const nightAssets = vi.fn()
const saveNightAsset = vi.fn()
const findConcept = vi.fn()
const readSeries = vi.fn()
const readTalent = vi.fn()

vi.mock("@/modules/promote/promote.repository", () => ({ promoteRepository: { nightAssets } }))
vi.mock("@/modules/promote/promote.service", () => ({ saveNightAsset }))
vi.mock("@/modules/series/series.repository", () => ({ seriesRepository: { findConcept } }))
vi.mock("@/modules/series/series.service", () => ({ readSeries }))
vi.mock("@/modules/talent/talent.read", () => ({ readTalent }))

const { readinessService, readReadiness } = await import("./readiness.service")

const venue = {
  id: "v1",
  timeZone: "America/New_York",
  currency: "USD",
  settings: { capabilities: ["stage"], talentBudget: 350 },
} as unknown as Parameters<typeof readReadiness>[1]
const nights = [
  { id: "n1", startsAt: "2026-10-21T00:00:00Z", localDate: "2026-10-20" },
  { id: "n2", startsAt: "2026-10-28T00:00:00Z", localDate: "2026-10-27" },
]

beforeEach(() => {
  vi.clearAllMocks()
  findConcept.mockResolvedValue({ name: "Sample Night", needs: ["stage"], estimated_cost_cents: 20000 })
  readSeries.mockResolvedValue({ id: "s1", nights })
  readTalent.mockResolvedValue({ talent: [{ booked: true }, { booked: false }], references: [] })
  nightAssets.mockResolvedValue([
    { id: "n1", assets: { ad: { template: "block" }, checklist: { done: ["staff"] } } },
    { id: "n2", assets: { checklist: { done: ["door", 7] } } },
  ])
})

describe("readReadiness", () => {
  it("reads every step from what exists, and the logistics of the next night coming", async () => {
    const ready = await readReadiness({} as never, venue, "c1", new Date("2026-10-22T12:00:00Z"))
    expect(ready?.night).toEqual({ id: "n2", localDate: "2026-10-27" })
    expect(ready?.steps.every((step) => step.done)).toBe(true)
    expect(ready?.logistics.filter((item) => item.done).map((item) => item.id)).toEqual(["door"])
  })

  it("falls back to the first night once every date has passed", async () => {
    const ready = await readReadiness({} as never, venue, "c1", new Date("2027-01-01T00:00:00Z"))
    expect(ready?.night?.id).toBe("n1")
  })

  it("has no night and no saved ad before the four weeks exist", async () => {
    readSeries.mockResolvedValue(null)
    const ready = await readReadiness({} as never, venue, "c1")
    expect(ready?.night).toBeNull()
    expect(ready?.steps.find((step) => step.id === "series")?.done).toBe(false)
    expect(nightAssets).not.toHaveBeenCalled()
  })

  it("is null when the caller cannot see the night", async () => {
    findConcept.mockResolvedValue(null)
    expect(await readReadiness({} as never, venue, "c1")).toBeNull()
  })
})

describe("readinessService.saveChecklist", () => {
  it("saves the ticks, once each, beside the night's other assets", async () => {
    const ctx = { supabase: {}, user: { id: "u1" } } as unknown as RequestContext
    await readinessService.saveChecklist(ctx, "n1", { done: ["staff", "staff", "door"] })
    expect(saveNightAsset).toHaveBeenCalledWith(ctx, "n1", "checklist", { done: ["staff", "door"] })
  })
})
