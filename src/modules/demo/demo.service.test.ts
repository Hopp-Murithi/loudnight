import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"

const repo = {
  findVenue: vi.fn(),
  latestPlan: vi.fn(),
  listDemoIds: vi.fn(),
  venueForUpkeep: vi.fn(),
  topConceptId: vi.fn(),
  markChosen: vi.fn(),
  deleteRuns: vi.fn(),
  runIdsFor: vi.fn(),
}
const runs = { createPair: vi.fn(), claimStep: vi.fn() }
const runAndStoreStep = vi.fn()
const storeGenericAnswer = vi.fn()
const readRun = vi.fn()
const listShortlist = vi.fn()

vi.mock("./demo.repository", () => ({ demoRepository: repo }))
vi.mock("@/modules/runs/runs.repository", () => ({ runsRepository: runs }))
vi.mock("@/modules/runs/runs.execute", () => ({ runAndStoreStep, storeGenericAnswer }))
vi.mock("@/modules/runs/runs.read", () => ({ readRun }))
vi.mock("@/modules/concepts/concepts.read", () => ({ listShortlist }))

const { precomputeDemoVenue, readDemoPlan } = await import("./demo.service")

const admin = {} as AdminSupabase
const visitor = {} as ServerSupabase
const settings = {
  search_radius_m: 2000,
  slow_night: "tuesday",
  capacity: 90,
  capabilities: ["stage"],
  break_even_headcount: 40,
  talent_budget_cents: 30000,
  average_spend_cents: 2000,
}
const venue = {
  id: "v1",
  name: "Sample Room",
  address: "1 Sample St, Sampletown, NY 10000",
  venue_type: "bar",
  google_place_id: null,
  latitude: 40.7,
  longitude: -73.9,
  time_zone: "America/New_York",
  is_demo: true,
  venue_settings: settings,
}

beforeEach(() => {
  vi.clearAllMocks()
  repo.venueForUpkeep.mockResolvedValue(venue)
  repo.runIdsFor.mockResolvedValue(["old-encore", "old-generic"])
  repo.topConceptId.mockResolvedValue("c1")
  runs.createPair.mockResolvedValue({ encoreId: "new-encore", genericId: "new-generic" })
  runs.claimStep.mockResolvedValue(true)
  runAndStoreStep.mockImplementation(async (trace: { step: string }, _venue: unknown, context: object) => ({
    context: { ...context, summary: { shortlisted: 3 } },
    findings: [],
    latencyMs: 1,
  }))
})

describe("precomputeDemoVenue", () => {
  it("refuses a venue that is not a demo venue", async () => {
    repo.venueForUpkeep.mockResolvedValue({ ...venue, is_demo: false })
    await expect(precomputeDemoVenue(admin, "v1")).rejects.toMatchObject({ code: "forbidden" })
    expect(runs.createPair).not.toHaveBeenCalled()
  })

  it("runs the six steps in order with nobody asking, marks the top night and replaces the old plan", async () => {
    const summary = await precomputeDemoVenue(admin, "v1")
    expect(runs.createPair).toHaveBeenCalledWith(admin, "v1", null, "tuesday")
    expect(runAndStoreStep.mock.calls.map(([trace]) => trace.step)).toEqual([
      "scout",
      "read_neighbourhood",
      "find_gap",
      "generate_concepts",
      "score",
      "plan",
    ])
    expect(storeGenericAnswer).toHaveBeenCalledWith(
      admin,
      "new-generic",
      expect.objectContaining({ name: "Sample Room" }),
    )
    expect(repo.markChosen).toHaveBeenCalledWith(admin, "c1")
    expect(repo.deleteRuns).toHaveBeenCalledTimes(1)
    expect(repo.deleteRuns).toHaveBeenCalledWith(admin, ["old-encore", "old-generic"])
    expect(summary).toMatchObject({ runId: "new-encore", concepts: 3 })
  })

  it("keeps the previous plan when a step fails, and removes only the half-made one", async () => {
    runAndStoreStep.mockRejectedValueOnce(new Error("upstream"))
    await expect(precomputeDemoVenue(admin, "v1")).rejects.toThrow("upstream")
    expect(repo.deleteRuns).toHaveBeenCalledTimes(1)
    expect(repo.deleteRuns).toHaveBeenCalledWith(admin, ["new-encore"])
    expect(repo.markChosen).not.toHaveBeenCalled()
  })

  it("keeps the previous plan when no night passed the evidence check", async () => {
    repo.topConceptId.mockResolvedValue(null)
    await expect(precomputeDemoVenue(admin, "v1")).rejects.toMatchObject({ code: "upstream_failed" })
    expect(repo.deleteRuns).toHaveBeenCalledWith(admin, ["new-encore"])
  })
})

describe("readDemoPlan", () => {
  const row = { ...venue, venue_settings: [settings] }

  it("is not found when the venue is not a readable demo venue", async () => {
    repo.findVenue.mockResolvedValue(null)
    await expect(readDemoPlan(visitor, "v1")).rejects.toMatchObject({ code: "not_found" })
  })

  it("says honestly when no plan is ready yet", async () => {
    repo.findVenue.mockResolvedValue(row)
    repo.latestPlan.mockResolvedValue(null)
    const plan = await readDemoPlan(visitor, "v1")
    expect(plan).toMatchObject({ run: null, concepts: [], venue: { breakEvenHeadcount: 40, slowNight: "tuesday" } })
    expect(readRun).not.toHaveBeenCalled()
  })

  it("reads the newest finished plan through the visitor's own client", async () => {
    repo.findVenue.mockResolvedValue(row)
    repo.latestPlan.mockResolvedValue({ id: "r1", created_at: "2026-10-13T09:00:00Z" })
    readRun.mockResolvedValue({ id: "r1" })
    listShortlist.mockResolvedValue([{ id: "c1" }])
    const plan = await readDemoPlan(visitor, "v1")
    expect(readRun).toHaveBeenCalledWith(visitor, "r1")
    expect(listShortlist).toHaveBeenCalledWith(visitor, "r1")
    expect(plan.concepts).toHaveLength(1)
  })
})
