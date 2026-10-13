import { beforeEach, describe, expect, it, vi } from "vitest"
import type { RequestContext } from "@/modules/auth/types"

const repo = {
  findConcept: vi.fn(),
  runWeekday: vi.fn(),
  create: vi.fn(),
  findByConcept: vi.fn(),
  findById: vi.fn(),
  findNight: vi.fn(),
  updateDraftNight: vi.fn(),
}
const managedVenue = vi.fn()
const writeVariations = vi.fn()

vi.mock("./series.repository", () => ({ seriesRepository: repo }))
vi.mock("./series.variations", () => ({ writeVariations }))
vi.mock("@/modules/venues/venues.access", () => ({ managedVenue }))

const { createSeries, readSeries, seriesService } = await import("./series.service")

const ctx = { supabase: {}, user: { id: "u1" } } as unknown as RequestContext
const concept = {
  id: "3fa94c1e-2c1b-4c55-9d2e-0b7a3c1e0001",
  venue_id: "v1",
  run_id: "r1",
  name: "Sample Night",
  pitch: "A sample pitch.",
  format: "live_music" as const,
  themes: ["sample"],
  chosen_at: "2026-10-13T10:00:00Z",
}
const venue = { id: "v1", timeZone: "America/New_York", settings: { capabilities: ["stage"] } }
const twists = ["Twist one here.", "Twist two here.", "Twist three here.", "Twist four here."]

beforeEach(() => {
  vi.clearAllMocks()
  repo.findConcept.mockResolvedValue(concept)
  repo.runWeekday.mockResolvedValue("tuesday")
  repo.create.mockResolvedValue("s1")
  managedVenue.mockResolvedValue(venue)
  writeVariations.mockResolvedValue(twists)
})

describe("createSeries", () => {
  it("makes four weekly nights from next week in one call, each with its twist and its own link", async () => {
    const now = new Date("2026-10-13T16:00:00Z")
    await createSeries({} as never, { timeZone: "America/New_York", capabilities: [] }, concept, now)
    const [, conceptId, startsOn, nights] = repo.create.mock.calls[0]
    expect(conceptId).toBe(concept.id)
    expect(startsOn).toBe("2026-10-20")
    expect(nights.map((night: { variation: string }) => night.variation)).toEqual(twists)
    expect(nights[0]).toMatchObject({ starts_at: "2026-10-21T00:00:00.000Z", slug: "sample-night-tue-oct-20-3fa9" })
    expect(new Set(nights.map((night: { slug: string }) => night.slug)).size).toBe(4)
  })
})

describe("seriesService.create", () => {
  it("refuses a night that has not been chosen", async () => {
    repo.findConcept.mockResolvedValue({ ...concept, chosen_at: null })
    await expect(seriesService.create(ctx, concept.id)).rejects.toMatchObject({ code: "conflict" })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it("is not found when the caller cannot see the night", async () => {
    repo.findConcept.mockResolvedValue(null)
    await expect(seriesService.create(ctx, concept.id)).rejects.toMatchObject({ code: "not_found" })
  })

  it("checks the caller manages the venue before anything is written", async () => {
    managedVenue.mockRejectedValue(Object.assign(new Error("no"), { code: "forbidden" }))
    await expect(seriesService.create(ctx, concept.id)).rejects.toMatchObject({ code: "forbidden" })
    expect(writeVariations).not.toHaveBeenCalled()
    expect(repo.create).not.toHaveBeenCalled()
  })

  it("returns the new series", async () => {
    expect(await seriesService.create(ctx, concept.id)).toEqual({ seriesId: "s1" })
  })
})

describe("seriesService.updateNight", () => {
  const input = { date: "2026-10-27", time: "19:30", variation: "A guest act joins." }

  it("saves the time as an instant on the venue's own clock", async () => {
    repo.findNight.mockResolvedValue({ id: "n1", venue_id: "v1", status: "draft" })
    repo.updateDraftNight.mockResolvedValue(true)
    await seriesService.updateNight(ctx, "n1", input)
    expect(repo.updateDraftNight).toHaveBeenCalledWith(ctx.supabase, "n1", {
      starts_at: "2026-10-27T23:30:00.000Z",
      variation: "A guest act joins.",
    })
  })

  it("leaves a published night alone", async () => {
    repo.findNight.mockResolvedValue({ id: "n1", venue_id: "v1", status: "published" })
    await expect(seriesService.updateNight(ctx, "n1", input)).rejects.toMatchObject({ code: "conflict" })
    expect(repo.updateDraftNight).not.toHaveBeenCalled()
  })

  it("is not found for a night the caller cannot see", async () => {
    repo.findNight.mockResolvedValue(null)
    await expect(seriesService.updateNight(ctx, "n1", input)).rejects.toMatchObject({ code: "not_found" })
  })
})

describe("readSeries", () => {
  it("orders the nights and shows each on the venue's clock", async () => {
    repo.findByConcept.mockResolvedValue({
      id: "s1",
      concept_id: concept.id,
      status: "draft",
      event_nights: [
        { id: "n2", sequence: 2, starts_at: "2026-10-28T00:00:00Z", variation: "Two", status: "draft" },
        { id: "n1", sequence: 1, starts_at: "2026-10-21T00:00:00Z", variation: "One", status: "draft" },
      ],
    })
    const series = await readSeries({} as never, concept.id, "America/New_York")
    expect(series?.nights.map((night) => [night.id, night.localDate, night.localTime])).toEqual([
      ["n1", "2026-10-20", "20:00"],
      ["n2", "2026-10-27", "20:00"],
    ])
  })

  it("is null before the series is made", async () => {
    repo.findByConcept.mockResolvedValue(null)
    expect(await readSeries({} as never, concept.id, "America/New_York")).toBeNull()
  })
})
