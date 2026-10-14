import { beforeEach, describe, expect, it, vi } from "vitest"
import { AD_DEFAULT } from "@/config/promote"
import type { RequestContext } from "@/modules/auth/types"
import { adDesignSchema, readDesign } from "./promote.schemas"

const repo = { nightAssets: vi.fn(), findNight: vi.fn(), saveAssets: vi.fn() }
const findConcept = vi.fn()
const readSeries = vi.fn()
const readTalent = vi.fn()
const managedVenue = vi.fn()

vi.mock("./promote.repository", () => ({ promoteRepository: repo }))
vi.mock("@/modules/series/series.repository", () => ({ seriesRepository: { findConcept } }))
vi.mock("@/modules/series/series.service", () => ({ readSeries }))
vi.mock("@/modules/talent/talent.read", () => ({ readTalent }))
vi.mock("@/modules/venues/venues.access", () => ({ managedVenue }))

const { promoteService, readPromoBoard } = await import("./promote.service")

const ctx = { supabase: {}, user: { id: "u1" } } as unknown as RequestContext
const venue = {
  id: "v1",
  name: "Sample Room",
  address: "1 Sample St, Brooklyn, NY 11211",
  city: null,
  timeZone: "America/New_York",
}
const design = {
  template: "block",
  palette: "plum",
  photo: "mood",
  line: "Free entry",
  language: "en",
  link: "",
} as const
const act = (name: string, bookedAt: string | null) => ({
  name,
  booked: bookedAt !== null,
  bookedAt,
  profile: { imageUrl: `https://images.qloo.com/i/${name}.jpg` },
})

beforeEach(() => {
  vi.clearAllMocks()
  findConcept.mockResolvedValue({ name: "Sample Night", format: "live_music", themes: ["sample"] })
  readSeries.mockResolvedValue({
    id: "s1",
    nights: [
      { id: "n1", sequence: 1 },
      { id: "n2", sequence: 2 },
    ],
  })
  readTalent.mockResolvedValue({
    talent: [act("First", null), act("Third", "2026-10-13T12:00:00Z"), act("Second", "2026-10-13T10:00:00Z")],
    references: [],
  })
  repo.nightAssets.mockResolvedValue([
    { id: "n1", assets: { ad: design, other: 1 } },
    { id: "n2", assets: {} },
  ])
  managedVenue.mockResolvedValue(venue)
})

describe("readPromoBoard", () => {
  it("gives each night its saved design, or the default, and names every booked act in the order they said yes", async () => {
    const board = await readPromoBoard({} as never, venue, "c1")
    expect(board?.venue.city).toBe("Brooklyn, NY")
    expect(board?.nights.map((night) => night.design)).toEqual([design, { ...AD_DEFAULT }])
    expect(board?.acts).toEqual([
      { name: "Second", imageUrl: "https://images.qloo.com/i/Second.jpg" },
      { name: "Third", imageUrl: "https://images.qloo.com/i/Third.jpg" },
    ])
  })

  it("names no act when nobody has said yes", async () => {
    readTalent.mockResolvedValue({ talent: [act("First", null)], references: [] })
    expect((await readPromoBoard({} as never, venue, "c1"))?.acts).toEqual([])
  })

  it("is null until the night has its four weeks", async () => {
    readSeries.mockResolvedValue(null)
    expect(await readPromoBoard({} as never, venue, "c1")).toBeNull()
  })
})

describe("promoteService.saveDesign", () => {
  it("keeps the night's other assets and checks the caller manages the venue", async () => {
    repo.findNight.mockResolvedValue({ id: "n1", venue_id: "v1", assets: { kit: { done: true } } })
    repo.saveAssets.mockResolvedValue(true)
    await promoteService.saveDesign(ctx, "n1", design)
    expect(managedVenue).toHaveBeenCalledWith(ctx, "v1")
    expect(repo.saveAssets).toHaveBeenCalledWith(ctx.supabase, "n1", { kit: { done: true }, ad: design })
  })

  it("is not found for a night the caller cannot see, or cannot change", async () => {
    repo.findNight.mockResolvedValue(null)
    await expect(promoteService.saveDesign(ctx, "n1", design)).rejects.toMatchObject({ code: "not_found" })
    repo.findNight.mockResolvedValue({ id: "n1", venue_id: "v1", assets: {} })
    repo.saveAssets.mockResolvedValue(false)
    await expect(promoteService.saveDesign(ctx, "n1", design)).rejects.toMatchObject({ code: "not_found" })
  })
})

describe("the design schema", () => {
  it("accepts a known layout, colourway and photo, and trims the line", () => {
    expect(adDesignSchema.parse({ ...design, line: "  Free entry  " }).line).toBe("Free entry")
  })

  it("refuses an unknown layout or a line that would crowd the ad", () => {
    expect(adDesignSchema.safeParse({ ...design, template: "collage" }).success).toBe(false)
    expect(adDesignSchema.safeParse({ ...design, line: "x".repeat(71) }).success).toBe(false)
  })

  it("reads anything it does not recognise as the default design", () => {
    expect(readDesign(undefined)).toEqual({ ...AD_DEFAULT })
    expect(readDesign({ template: "collage" })).toEqual({ ...AD_DEFAULT })
  })
})
