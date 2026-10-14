import { beforeEach, describe, expect, it, vi } from "vitest"

const talentRepo = { listForConcept: vi.fn(), findForReceipt: vi.fn() }
const receiptAt = vi.fn()

vi.mock("./talent.repository", () => ({ talentRepository: talentRepo }))
vi.mock("@/modules/concepts/concepts.read", () => ({ receiptAt }))

const { readTalent, readTalentReceipt } = await import("./talent.read")
const { EMPTY_PROFILE } = await import("./talent.profile")

// Made-up rows in the shape the database returns.
const row = {
  id: "1",
  name: "Sample Act",
  popularity_tier: "local",
  overlap_score: "0.910",
  fit_signals: ["Sample soul"],
  outreach_draft: "Draft",
  outreach_edited: "Mine",
  qloo_cache_id: "cache",
  booked_at: null,
  profile: {},
  source: "night",
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("readTalent", () => {
  it("shows the owner's wording over the draft and keeps famous names apart", async () => {
    talentRepo.listForConcept.mockResolvedValue([row, { ...row, id: "2", popularity_tier: "national" }])
    const { talent, references } = await readTalent({} as never, "c1")
    expect(talent).toHaveLength(1)
    expect(talent[0]).toMatchObject({ message: "Mine", edited: true, overlap: 0.91, hasReceipt: true, source: "night" })
    expect(references.map((act) => act.id)).toEqual(["2"])
  })

  it("lists booked acts first, then local acts, then the closest match", async () => {
    talentRepo.listForConcept.mockResolvedValue([
      { ...row, id: "fit", overlap_score: "0.990" },
      { ...row, id: "area", source: "area", overlap_score: "0.700" },
      { ...row, id: "both", source: "both", overlap_score: "0.600" },
      { ...row, id: "booked", overlap_score: "0.500", booked_at: "2026-10-13T10:00:00Z" },
    ])
    const { talent } = await readTalent({} as never, "c1")
    expect(talent.map((act) => act.id)).toEqual(["booked", "both", "area", "fit"])
    expect(talent[0]).toMatchObject({ booked: true, bookedAt: "2026-10-13T10:00:00Z" })
  })

  it("puts acts from the venue's own country right after booked ones", async () => {
    talentRepo.listForConcept.mockResolvedValue([
      { ...row, id: "abroad", source: "both", profile: { ...EMPTY_PROFILE, home: "NG" } },
      { ...row, id: "home", source: "night", profile: { ...EMPTY_PROFILE, home: "KE" } },
    ])
    const { talent } = await readTalent({} as never, "c1", { cents: 6_000_000, currency: "KES", country: "KE" })
    expect(talent.map((act) => act.id)).toEqual(["home", "abroad"])
  })

  it("reads an unknown source as a fit for the night", async () => {
    talentRepo.listForConcept.mockResolvedValue([{ ...row, source: "elsewhere" }])
    expect((await readTalent({} as never, "c1")).talent[0].source).toBe("night")
  })
})

describe("readTalentReceipt", () => {
  const stored = {
    name: "Sample Act",
    overlap_score: "0.910",
    response_path: ["results", "entities", "0", "query", "affinity"],
    qloo_cache_id: "cache",
    fit_signals: ["Sample soul"],
    source: "night",
  }

  it("is not found for an act the caller cannot see", async () => {
    talentRepo.findForReceipt.mockResolvedValue(null)
    await expect(readTalentReceipt({} as never, "1")).rejects.toMatchObject({ code: "not_found" })
    expect(receiptAt).not.toHaveBeenCalled()
  })

  it("points the receipt at the act's own place in the stored answer", async () => {
    talentRepo.findForReceipt.mockResolvedValue(stored)
    await readTalentReceipt({} as never, "1")
    expect(receiptAt).toHaveBeenCalledWith(
      "cache",
      ["results", "entities", "0", "query", "affinity"],
      "Fans of Sample soul near you also follow Sample Act",
      0.91,
    )
  })

  it("says an area favourite is followed near the venue, not that it matches the night's tastes", async () => {
    talentRepo.findForReceipt.mockResolvedValue({ ...stored, source: "area", fit_signals: [] })
    await readTalentReceipt({} as never, "1")
    expect(receiptAt.mock.calls[0][2]).toBe("People near your venue follow Sample Act more than most places do")
  })
})
