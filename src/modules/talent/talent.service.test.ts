import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { RequestContext } from "@/modules/auth/types"

const talentRepo = {
  currentList: vi.fn(),
  refreshForConcept: vi.fn(),
  updateOwn: vi.fn(),
}
const cachedQloo = vi.fn()
const writeOutreach = vi.fn()
const findRun = vi.fn()

vi.mock("./talent.repository", () => ({ talentRepository: talentRepo }))
const householdNames = vi.fn()
vi.mock("./talent.outreach", () => ({ writeOutreach }))
vi.mock("./talent.stars", () => ({ householdNames }))
const openActs = vi.fn(async (): Promise<unknown[]> => [])
vi.mock("./talent.open-data", () => ({ openActs }))
vi.mock("@/modules/taste/taste.service", () => ({ cachedQloo }))
vi.mock("@/modules/runs/runs.repository", () => ({ runsRepository: { findRun } }))
vi.mock("@/modules/series/series.repository", () => ({ seriesRepository: {} }))
vi.mock("@/modules/venues/venues.access", () => ({ managedVenue: vi.fn() }))
vi.mock("@/lib/supabase/admin", () => ({ createAdminSupabase: vi.fn() }))

const { findTalent, talentService } = await import("./talent.service")
const { EMPTY_PROFILE } = await import("./talent.profile")

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
  point: { latitude: -1.29, longitude: 36.82 },
  timeZone: "America/New_York",
  talentBudgetCents: 30000,
  currency: "USD",
  countryCode: "KE",
  town: "Nyeri",
  hosts: ["poetry"],
}
const night = {
  conceptId: "c1",
  conceptName: "Sample Night",
  format: "live_music",
  runId: "r1",
  firstNight: "2026-10-21T00:00:00Z",
}
const entity = (id: string, popularity: number, affinity: number) => ({
  entity_id: id,
  name: "Sample Act " + id,
  popularity,
  query: { affinity },
  external: { spotify: [{ id: "sp" + id, monthly_listeners: 20000 }] },
  properties: id.startsWith("home") ? { place_of_birth: "Sample Town, Sample Country" } : {},
})

type Params = Record<string, unknown>
type Answers = { fits: object[]; area: object[]; famous: object[] }
let answers: Answers

// Each question gets its own answer, whatever order the service asks them in.
const which = (params: Params) =>
  params["filter.popularity.min"] !== undefined ? "famous" : params["signal.interests.tags"] ? "fits" : "area"

beforeEach(() => {
  vi.clearAllMocks()
  answers = {
    fits: [entity("a", 0.5, 0.91), entity("both", 0.45, 0.8), entity("big", 0.9, 0.99)],
    area: [entity("home", 0.3, 0.99), entity("both", 0.45, 0.98)],
    famous: [entity("star", 0.95, 0.97)],
  }
  findRun.mockResolvedValue({ context })
  talentRepo.currentList.mockResolvedValue([])
  writeOutreach.mockResolvedValue(new Map([["a", "Hello a"]]))
  householdNames.mockResolvedValue(new Set(["Sample Act home"]))
  cachedQloo.mockImplementation(async (_admin: unknown, request: { params: Params }) => {
    const kind = which(request.params)
    return { cacheId: `cache-${kind}`, fromCache: false, response: { results: { entities: answers[kind] } } }
  })
})

const stored = () => talentRepo.refreshForConcept.mock.calls[0][2] as Record<string, unknown>[]
const requests = () => cachedQloo.mock.calls.map(([, request]) => request.params as Params)
const asked = (kind: keyof Answers) => requests().filter((params) => which(params) === kind)

describe("findTalent", () => {
  it("asks for the night's fits, the area's own favourites and famous references, all near the venue", async () => {
    await findTalent(admin, venue, night)
    const [[fits], [area], [famous]] = [asked("fits"), asked("area"), asked("famous")]
    expect(fits).toMatchObject({ "signal.interests.tags": ["t1"], "filter.popularity.max": 0.8 })
    expect(area["signal.interests.tags"]).toBeUndefined()
    expect(area).toMatchObject({ "signal.location": "POINT(36.82 -1.29)", "filter.popularity.max": 0.8 })
    expect(famous).toMatchObject({ "filter.popularity.min": 0.8 })
  })

  it("looks for people, not musicians, when the night is not a music night", async () => {
    await findTalent(admin, venue, { ...night, format: "talk" })
    expect(asked("fits")[0]["filter.type"]).toBe("urn:entity:person")
  })

  it("puts local acts first: area favourites who fit the night, then area favourites, then other fits", async () => {
    expect(await findTalent(admin, venue, night)).toBe(3)
    expect(stored().map((row) => [row.qloo_entity_id, row.source])).toEqual([
      ["both", "both"],
      ["home", "area"],
      ["a", "night"],
      ["star", "night"],
    ])
  })

  it("keeps each act's receipt in the answer it came from, and where it was born when Qloo says", async () => {
    await findTalent(admin, venue, night)
    const [both, home, fit, star] = stored()
    expect(both).toMatchObject({
      qloo_cache_id: "cache-fits",
      response_path: ["results", "entities", "1", "query", "affinity"],
    })
    expect(home).toMatchObject({ qloo_cache_id: "cache-area", fit_signals: [] })
    expect((home.profile as { origin: string }).origin).toBe("Sample Town, Sample Country")
    expect((home.profile as { star: boolean }).star).toBe(true)
    expect((fit.profile as { star: boolean }).star).toBe(false)
    expect(householdNames.mock.calls[0][1]).toBe("Kenya")
    expect(fit).toMatchObject({ fit_signals: ["Sample soul"], outreach_draft: "Hello a", popularity_tier: "local" })
    expect(star).toMatchObject({ popularity_tier: "national", outreach_draft: null, qloo_cache_id: "cache-famous" })
  })

  it("moves one page on each time it looks again, and back to the first after the last", async () => {
    talentRepo.currentList.mockResolvedValue([
      { qloo_entity_id: "x", search_page: 1, booked_at: null, outreach_edited: null },
    ])
    await findTalent(admin, venue, night)
    expect(asked("fits")[0].page).toBe(2)
    expect(stored()[0].search_page).toBe(2)

    vi.clearAllMocks()
    talentRepo.currentList.mockResolvedValue([
      { qloo_entity_id: "x", search_page: 3, booked_at: null, outreach_edited: null },
    ])
    findRun.mockResolvedValue({ context })
    writeOutreach.mockResolvedValue(new Map())
    householdNames.mockResolvedValue(new Set())
    await findTalent(admin, venue, night)
    expect(asked("fits")[0].page).toBeUndefined()
  })

  it("starts again from the first page when a later page holds nobody bookable", async () => {
    talentRepo.currentList.mockResolvedValue([
      { qloo_entity_id: "x", search_page: 1, booked_at: null, outreach_edited: null },
    ])
    cachedQloo.mockImplementation(async (_admin: unknown, request: { params: Params }) => {
      const kind = which(request.params)
      const entities = request.params.page ? [] : answers[kind]
      return { cacheId: `cache-${kind}`, fromCache: false, response: { results: { entities } } }
    })
    expect(await findTalent(admin, venue, night)).toBe(3)
    expect(asked("fits").map((params) => params.page)).toEqual([2, undefined])
    expect(stored()[0].search_page).toBe(1)
  })

  it("never offers again an act the owner already booked or reworded, since that row is kept as it is", async () => {
    talentRepo.currentList.mockResolvedValue([
      { qloo_entity_id: "home", search_page: 1, booked_at: "2026-10-13T10:00:00Z", outreach_edited: null },
    ])
    await findTalent(admin, venue, night)
    expect(stored().map((row) => row.qloo_entity_id)).not.toContain("home")
  })

  it("offers only working musicians for a music night", async () => {
    answers.fits = [
      entity("a", 0.5, 0.91),
      { entity_id: "model", name: "Sample Model", popularity: 0.5, query: { affinity: 0.99 } },
    ]
    answers.area = []
    await findTalent(admin, venue, night)
    expect(stored().map((row) => row.qloo_entity_id)).toEqual(["a", "star"])
  })

  it("gives the copywriter the date, time and fee from the venue's own night and budget", async () => {
    await findTalent(admin, venue, night)
    expect(writeOutreach.mock.calls[0][1]).toEqual({ date: "Tuesday, October 20", time: "8:00 PM", fee: "up to $300" })
  })

  it("still returns a shortlist when the area and reference calls fail", async () => {
    cachedQloo.mockImplementation(async (_admin: unknown, request: { params: Params }) => {
      if (which(request.params) !== "fits") throw new Error("x")
      return { cacheId: "cache-fits", fromCache: false, response: { results: { entities: answers.fits } } }
    })
    expect(await findTalent(admin, venue, night)).toBe(2)
  })

  it("refuses when the plan holds no tastes to anchor on", async () => {
    findRun.mockResolvedValue({ context: {} })
    await expect(findTalent(admin, venue, night)).rejects.toMatchObject({ code: "conflict" })
    expect(talentRepo.refreshForConcept).not.toHaveBeenCalled()
  })
})

describe("talentService.update", () => {
  const ctx = { supabase: {}, user: { id: "u1" } } as unknown as RequestContext

  it("is not found when the database changed nothing, which is how RLS refuses door staff", async () => {
    talentRepo.updateOwn.mockResolvedValue(false)
    await expect(talentService.update(ctx, "1", { message: "Hi" })).rejects.toMatchObject({ code: "not_found" })
  })

  it("saves new wording with the caller's own client", async () => {
    talentRepo.updateOwn.mockResolvedValue(true)
    await talentService.update(ctx, "1", { message: "Hi" })
    expect(talentRepo.updateOwn).toHaveBeenCalledWith(ctx.supabase, "1", { outreach_edited: "Hi" })
  })

  it("stamps a booking, and clears it when the act falls through", async () => {
    talentRepo.updateOwn.mockResolvedValue(true)
    await talentService.update(ctx, "1", { booked: true })
    expect(talentRepo.updateOwn.mock.calls[0][2].booked_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    await talentService.update(ctx, "1", { booked: false })
    expect(talentRepo.updateOwn.mock.calls[1][2]).toEqual({ booked_at: null })
  })
})

describe("findTalent with open data", () => {
  const openAct = (id: string, name: string) => ({
    entityId: `wikidata:${id}`,
    name,
    popularity: 0.2,
    affinity: 0,
    index: 0,
    source: "wikidata",
    profile: { ...EMPTY_PROFILE, origin: "Sample Town" },
  })

  it("adds people from open records after Qloo's acts, with no receipt and no repeats", async () => {
    openActs.mockResolvedValueOnce([openAct("Q1", "Sample Poet"), openAct("Q2", "sample act a")])
    expect(await findTalent(admin, venue, { ...night, format: "talk", conceptName: "Poetry Supper" })).toBe(4)
    expect(openActs).toHaveBeenCalledWith(admin, { roles: ["poet"], townMusicians: false }, venue)
    const poet = stored().find((row) => row.qloo_entity_id === "wikidata:Q1")
    expect(poet).toMatchObject({ source: "wikidata", qloo_cache_id: null, response_path: [], fit_signals: [] })
    expect(stored().some((row) => row.qloo_entity_id === "wikidata:Q2")).toBe(false)
    expect(householdNames.mock.calls[0][0]).toContain("Sample Poet")
  })
})

describe("findTalent with open data and stars", () => {
  it("leaves household names from open records out entirely", async () => {
    openActs.mockResolvedValueOnce([
      {
        entityId: "musicbrainz:1",
        name: "Sample Star",
        popularity: null,
        affinity: 0,
        index: 0,
        source: "musicbrainz",
        profile: EMPTY_PROFILE,
      },
      {
        entityId: "musicbrainz:2",
        name: "Sample Band",
        popularity: null,
        affinity: 0,
        index: 1,
        source: "musicbrainz",
        profile: EMPTY_PROFILE,
      },
    ])
    householdNames.mockResolvedValueOnce(new Set(["Sample Star"]))
    await findTalent(admin, venue, night)
    const ids = stored().map((row) => row.qloo_entity_id)
    expect(ids).toContain("musicbrainz:2")
    expect(ids).not.toContain("musicbrainz:1")
  })
})
