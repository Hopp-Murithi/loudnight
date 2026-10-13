import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { RequestContext } from "@/modules/auth/types"

const talentRepo = {
  listForConcept: vi.fn(),
  findForReceipt: vi.fn(),
  replaceForConcept: vi.fn(),
  editOutreach: vi.fn(),
}
const cachedQloo = vi.fn()
const writeOutreach = vi.fn()
const findRun = vi.fn()
const receiptAt = vi.fn()

vi.mock("./talent.repository", () => ({ talentRepository: talentRepo }))
vi.mock("./talent.outreach", () => ({ writeOutreach }))
vi.mock("@/modules/taste/taste.service", () => ({ cachedQloo }))
vi.mock("@/modules/runs/runs.repository", () => ({ runsRepository: { findRun } }))
vi.mock("@/modules/concepts/concepts.read", () => ({ receiptAt }))
vi.mock("@/modules/series/series.repository", () => ({ seriesRepository: {} }))
vi.mock("@/modules/venues/venues.access", () => ({ managedVenue: vi.fn() }))
vi.mock("@/lib/supabase/admin", () => ({ createAdminSupabase: vi.fn() }))

const { findTalent, readTalent, readTalentReceipt, talentService } = await import("./talent.service")

// Made-up values in the shape the pipeline stores. Never real Qloo data.
const admin = {} as AdminSupabase
const receipt = { cacheId: "00000000-0000-4000-8000-000000000000", path: ["results", "tags", "0", "query", "affinity"] }
const context = {
  fingerprint: {
    domains: [
      {
        domain: "music_styles",
        label: "Music styles",
        status: "ok",
        items: [{ id: "t1", name: "Sample soul", affinity: 0.9, score: 1, popularity: null, receipt }],
      },
    ],
    audience: null,
  },
}
const venue = {
  id: "v1",
  name: "Sample Room",
  point: { latitude: 40.7, longitude: -73.9 },
  timeZone: "America/New_York",
  talentBudgetCents: 30000,
}
const night = {
  conceptId: "c1",
  conceptName: "Sample Night",
  format: "live_music",
  runId: "r1",
  firstNight: "2026-10-21T00:00:00Z",
}
const answer = (cacheId: string, entities: object[]) => ({
  cacheId,
  fromCache: false,
  response: { results: { entities } },
})
const entity = (id: string, popularity: number, affinity: number) => ({
  entity_id: id,
  name: "Sample Act " + id,
  popularity,
  query: { affinity },
})

beforeEach(() => {
  vi.clearAllMocks()
  findRun.mockResolvedValue({ context })
  writeOutreach.mockResolvedValue(new Map([["a", "Hello a"]]))
  cachedQloo
    .mockResolvedValueOnce(answer("cache-local", [entity("a", 0.5, 0.91), entity("big", 0.9, 0.99)]))
    .mockResolvedValueOnce(answer("cache-famous", [entity("star", 0.95, 0.97)]))
})

describe("findTalent", () => {
  it("asks Qloo for artists inside the bookable band, anchored on the night's tastes", async () => {
    await findTalent(admin, venue, night)
    const [, request] = cachedQloo.mock.calls[0]
    expect(request.params).toMatchObject({
      "filter.type": "urn:entity:artist",
      "signal.interests.tags": ["t1"],
      "filter.popularity.max": 0.8,
    })
  })

  it("looks for people, not musicians, when the night is not a music night", async () => {
    await findTalent(admin, venue, { ...night, format: "talk" })
    expect(cachedQloo.mock.calls[0][1].params["filter.type"]).toBe("urn:entity:person")
  })

  it("stores bookable acts with a message and receipt, and famous names only as references with no message", async () => {
    const found = await findTalent(admin, venue, night)
    const rows = talentRepo.replaceForConcept.mock.calls[0][2]
    expect(found).toBe(1)
    expect(rows.map((row: { qloo_entity_id: string }) => row.qloo_entity_id)).toEqual(["a", "star"])
    expect(rows[0]).toMatchObject({
      popularity_tier: "local",
      overlap_score: 0.91,
      qloo_cache_id: "cache-local",
      response_path: ["results", "entities", "0", "query", "affinity"],
      fit_signals: ["Sample soul"],
      outreach_draft: "Hello a",
    })
    expect(rows[1]).toMatchObject({ popularity_tier: "national", outreach_draft: null, qloo_cache_id: "cache-famous" })
  })

  it("gives the copywriter the date, time and fee from the venue's own night and budget", async () => {
    await findTalent(admin, venue, night)
    expect(writeOutreach.mock.calls[0][1]).toEqual({
      date: "Tuesday, October 20",
      time: "8:00 PM",
      fee: "up to $300",
    })
  })

  it("still returns the shortlist when the style-reference call fails", async () => {
    cachedQloo.mockReset()
    cachedQloo
      .mockResolvedValueOnce(answer("cache-local", [entity("a", 0.5, 0.91)]))
      .mockRejectedValueOnce(new Error("x"))
    expect(await findTalent(admin, venue, night)).toBe(1)
    expect(talentRepo.replaceForConcept.mock.calls[0][2]).toHaveLength(1)
  })

  it("refuses when the plan holds no tastes to anchor on", async () => {
    findRun.mockResolvedValue({ context: {} })
    await expect(findTalent(admin, venue, night)).rejects.toMatchObject({ code: "conflict" })
    expect(talentRepo.replaceForConcept).not.toHaveBeenCalled()
  })
})

describe("readTalent", () => {
  it("shows the owner's wording over the draft and keeps famous names apart", async () => {
    const row = {
      id: "1",
      name: "Sample Act",
      popularity_tier: "local",
      overlap_score: "0.910",
      fit_signals: ["Sample soul"],
      outreach_draft: "Draft",
      outreach_edited: "Mine",
      qloo_cache_id: "cache",
    }
    talentRepo.listForConcept.mockResolvedValue([
      row,
      { ...row, id: "2", popularity_tier: "national", outreach_edited: null },
    ])
    const { talent, references } = await readTalent({} as never, "c1")
    expect(talent).toHaveLength(1)
    expect(talent[0]).toMatchObject({ message: "Mine", edited: true, overlap: 0.91, hasReceipt: true })
    expect(references.map((act) => act.id)).toEqual(["2"])
  })
})

describe("readTalentReceipt", () => {
  it("is not found for an act the caller cannot see", async () => {
    talentRepo.findForReceipt.mockResolvedValue(null)
    await expect(readTalentReceipt({} as never, "1")).rejects.toMatchObject({ code: "not_found" })
    expect(receiptAt).not.toHaveBeenCalled()
  })

  it("points the receipt at the act's own place in the stored answer", async () => {
    talentRepo.findForReceipt.mockResolvedValue({
      name: "Sample Act",
      overlap_score: "0.910",
      response_path: ["results", "entities", "0", "query", "affinity"],
      qloo_cache_id: "cache",
      fit_signals: ["Sample soul"],
    })
    await readTalentReceipt({} as never, "1")
    expect(receiptAt).toHaveBeenCalledWith(
      "cache",
      ["results", "entities", "0", "query", "affinity"],
      "Fans of Sample soul near you also follow Sample Act",
      0.91,
    )
  })
})

describe("talentService.editOutreach", () => {
  const ctx = { supabase: {}, user: { id: "u1" } } as unknown as RequestContext

  it("is not found when the database changed nothing, which is how RLS refuses door staff", async () => {
    talentRepo.editOutreach.mockResolvedValue(false)
    await expect(talentService.editOutreach(ctx, "1", "Hi")).rejects.toMatchObject({ code: "not_found" })
  })

  it("saves with the caller's own client", async () => {
    talentRepo.editOutreach.mockResolvedValue(true)
    await talentService.editOutreach(ctx, "1", "Hi")
    expect(talentRepo.editOutreach).toHaveBeenCalledWith(ctx.supabase, "1", "Hi")
  })
})
