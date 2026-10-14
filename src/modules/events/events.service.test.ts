import { beforeEach, describe, expect, it, vi } from "vitest"
import type { RequestContext } from "@/modules/auth/types"

const repo = {
  findPublicNight: vi.fn(),
  findPublicVenue: vi.fn(),
  nextPublishedNight: vi.fn(),
  reservePlace: vi.fn(),
  findNight: vi.fn(),
  countRsvps: vi.fn(),
  moveNight: vi.fn(),
}
const managedVenue = vi.fn()
const findById = vi.fn()
const findConcept = vi.fn()
const readTalent = vi.fn()

vi.mock("./events.repository", () => ({ eventsRepository: repo }))
vi.mock("@/modules/venues/venues.access", () => ({ managedVenue }))
vi.mock("@/modules/series/series.repository", () => ({ seriesRepository: { findById, findConcept } }))
vi.mock("@/modules/talent/talent.read", () => ({ readTalent }))

const { eventsService } = await import("./events.service")
const { readEventPage } = await import("./events.read")

// Made-up rows in the shape the database returns.
const night = {
  id: "n1",
  venue_id: "v1",
  series_id: "s1",
  sequence: 1,
  starts_at: "2026-10-22T17:00:00Z",
  status: "published",
  title: "Sample Supper",
  blurb: "A sample night.",
  lineup: ["Sample Act"],
  variation: "Opening night",
  public_slug: "sample-supper-one",
}
const venue = {
  id: "v1",
  name: "Sample Room",
  address: "Sample Rd, Nairobi, Kenya",
  city: "Nairobi",
  time_zone: "Africa/Nairobi",
  latitude: -1.3,
  longitude: 36.8,
  suspended_at: null as string | null,
}
const guest = { name: "Ada", partySize: 2, consent: false }
const supabase = {} as never
const ctx = { supabase: {}, user: { id: "u1" } } as unknown as RequestContext

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-10-20T12:00:00Z"))
  repo.findPublicNight.mockResolvedValue(night)
  repo.findPublicVenue.mockResolvedValue(venue)
  repo.reservePlace.mockResolvedValue(null)
})

describe("readEventPage", () => {
  it("shows the night's public face and the venue's town", async () => {
    const page = await readEventPage(supabase, "sample-supper-one")
    expect(page).toMatchObject({ title: "Sample Supper", lineup: ["Sample Act"], past: false, nextSlug: null })
    expect(page?.venue.town).toBe("Nairobi")
  })

  it("says a night is over six hours after it starts, and points at the next one", async () => {
    vi.setSystemTime(new Date("2026-10-23T00:00:00Z"))
    repo.nextPublishedNight.mockResolvedValue("sample-supper-two")
    expect(await readEventPage(supabase, "sample-supper-one")).toMatchObject({
      past: true,
      nextSlug: "sample-supper-two",
    })
  })

  it("does not exist for a draft", async () => {
    repo.findPublicNight.mockResolvedValue({ ...night, status: "draft" })
    expect(await readEventPage(supabase, "x")).toBeNull()
  })
})

describe("eventsService.rsvp", () => {
  it("makes the code on the server and gives it back", async () => {
    const { code } = await eventsService.rsvp(supabase, "sample-supper-one", guest)
    expect(code).toMatch(/^[2-9a-hjkmnp-z]{12}$/)
    expect(repo.reservePlace).toHaveBeenCalledWith(supabase, {
      nightId: "n1",
      name: "Ada",
      partySize: 2,
      contact: null,
      code,
    })
  })

  it("says kindly when the same contact is already on the list", async () => {
    repo.reservePlace.mockResolvedValue("23505")
    await expect(
      eventsService.rsvp(supabase, "s", { ...guest, contact: "ada@example.com", consent: true }),
    ).rejects.toMatchObject({ code: "conflict", message: expect.stringContaining("already on the list") })
  })

  it("takes no RSVPs for a cancelled or finished night, and none from the bot trap", async () => {
    repo.findPublicNight.mockResolvedValue({ ...night, status: "cancelled" })
    await expect(eventsService.rsvp(supabase, "s", guest)).rejects.toMatchObject({ code: "conflict" })
    repo.findPublicNight.mockResolvedValue(night)
    vi.setSystemTime(new Date("2026-10-23T00:00:00Z"))
    await expect(eventsService.rsvp(supabase, "s", guest)).rejects.toMatchObject({ code: "conflict" })
    await expect(eventsService.rsvp(supabase, "s", { ...guest, website: "spam" })).rejects.toMatchObject({
      code: "validation_failed",
    })
    expect(repo.reservePlace).not.toHaveBeenCalled()
  })

  it("shows a suspended venue's night but takes no RSVPs for it", async () => {
    repo.findPublicVenue.mockResolvedValue({ ...venue, suspended_at: "2026-10-20T10:00:00Z" })
    expect(await readEventPage(supabase, "s")).toMatchObject({ paused: true })
    await expect(eventsService.rsvp(supabase, "s", guest)).rejects.toMatchObject({
      code: "conflict",
      message: "This venue is not taking bookings right now.",
    })
    expect(repo.reservePlace).not.toHaveBeenCalled()
  })
})

describe("eventsService.changeNight", () => {
  beforeEach(() => {
    repo.findNight.mockResolvedValue({ id: "n1", venue_id: "v1", series_id: "s1", status: "draft", sequence: 1 })
    repo.moveNight.mockResolvedValue(true)
    findById.mockResolvedValue({ concept_id: "c1" })
    findConcept.mockResolvedValue({ id: "c1", name: "Sample Supper", pitch: "A sample night." })
    readTalent.mockResolvedValue({
      talent: [
        { name: "Later Act", bookedAt: "2026-10-14T12:00:00Z" },
        { name: "Not Booked", bookedAt: null },
        { name: "First Act", bookedAt: "2026-10-14T10:00:00Z" },
      ],
      references: [],
    })
  })

  it("publishes with the night's name, pitch and booked acts in the order they said yes", async () => {
    await eventsService.changeNight(ctx, "n1", "publish")
    expect(managedVenue).toHaveBeenCalledWith(ctx, "v1")
    const [, , from, changes] = repo.moveNight.mock.calls[0]
    expect(from).toEqual(["draft", "cancelled"])
    expect(changes).toMatchObject({
      status: "published",
      title: "Sample Supper",
      blurb: "A sample night.",
      lineup: ["First Act", "Later Act"],
    })
  })

  it("will not take a night back to draft once people have RSVP'd", async () => {
    repo.countRsvps.mockResolvedValue(3)
    await expect(eventsService.changeNight(ctx, "n1", "unpublish")).rejects.toMatchObject({ code: "conflict" })
    expect(repo.moveNight).not.toHaveBeenCalled()
  })

  it("cancels only a published night", async () => {
    repo.moveNight.mockResolvedValue(false)
    await expect(eventsService.changeNight(ctx, "n1", "cancel")).rejects.toMatchObject({ code: "conflict" })
    expect(repo.moveNight.mock.calls[0][2]).toEqual(["published"])
  })

  it("is not found for a night the caller cannot see", async () => {
    repo.findNight.mockResolvedValue(null)
    await expect(eventsService.changeNight(ctx, "n1", "publish")).rejects.toMatchObject({ code: "not_found" })
  })
})
