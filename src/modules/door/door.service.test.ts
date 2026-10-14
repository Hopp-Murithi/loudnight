import { beforeEach, describe, expect, it, vi } from "vitest"
import { forbidden } from "@/lib/http/errors"
import type { RequestContext } from "@/modules/auth/types"

const repo = {
  findNight: vi.fn(),
  rsvpByCode: vi.fn(),
  rsvpById: vi.fn(),
  arrivalOf: vi.fn(),
  addArrival: vi.fn(),
  addSelfArrival: vi.fn(),
  saveSpend: vi.fn(),
}
const readEventPage = vi.fn()
const managedVenue = vi.fn()

vi.mock("./door.repository", () => ({ doorRepository: repo }))
vi.mock("@/modules/events/events.read", () => ({ readEventPage }))
vi.mock("@/modules/venues/venues.access", () => ({ managedVenue }))
vi.mock("@/modules/venues/venues.service", () => ({ venuesService: { getDetail: vi.fn() } }))

const { doorService } = await import("./door.service")

// Made-up rows in the shape the database returns.
const ctx = { supabase: {}, user: { id: "door-1" } } as unknown as RequestContext
const night = {
  id: "n1",
  venue_id: "v1",
  public_slug: "s",
  title: "Sample",
  starts_at: "2026-10-20T20:00:00Z",
  status: "published",
}
const ada = { id: "r1", event_night_id: "n1", venue_id: "v1", guest_name: "Ada", party_size: 2 }

beforeEach(() => {
  vi.clearAllMocks()
  repo.findNight.mockResolvedValue(night)
  repo.rsvpByCode.mockResolvedValue(ada)
  repo.arrivalOf.mockResolvedValue(null)
  repo.addArrival.mockResolvedValue({ at: "2026-10-20T20:14:00Z", failure: null })
})

describe("doorService.checkIn", () => {
  it("lets a ticket's guests in, read from the ticket's link", async () => {
    const result = await doorService.checkIn(ctx, "n1", { code: "https://encore.example/e/s/ticket/AB2C3D4E5F6G" })
    expect(repo.rsvpByCode).toHaveBeenCalledWith(ctx.supabase, "ab2c3d4e5f6g")
    expect(repo.addArrival).toHaveBeenCalledWith(ctx.supabase, {
      event_night_id: "n1",
      venue_id: "v1",
      rsvp_id: "r1",
      party_size: 2,
    })
    expect(result).toEqual({ status: "in", name: "Ada", partySize: 2, at: "2026-10-20T20:14:00Z" })
  })

  it("says when a ticket was first used instead of counting it twice", async () => {
    repo.arrivalOf.mockResolvedValue("2026-10-20T20:14:00Z")
    expect(await doorService.checkIn(ctx, "n1", { code: "ab2c3d4e5f6g" })).toMatchObject({ status: "already" })
    expect(repo.addArrival).not.toHaveBeenCalled()
  })

  it("treats two phones scanning the same ticket at once as one arrival", async () => {
    repo.addArrival.mockResolvedValue({ at: null, failure: "23505" })
    repo.arrivalOf.mockResolvedValueOnce(null).mockResolvedValueOnce("2026-10-20T20:14:00Z")
    expect(await doorService.checkIn(ctx, "n1", { code: "ab2c3d4e5f6g" })).toMatchObject({ status: "already" })
  })

  it("refuses a code it cannot read, a ticket it cannot find, and another night's ticket", async () => {
    await expect(doorService.checkIn(ctx, "n1", { code: "hello" })).rejects.toMatchObject({ code: "not_found" })
    repo.rsvpByCode.mockResolvedValue(null)
    await expect(doorService.checkIn(ctx, "n1", { code: "ab2c3d4e5f6g" })).rejects.toMatchObject({ code: "not_found" })
    repo.rsvpByCode.mockResolvedValue({ ...ada, event_night_id: "n2" })
    await expect(doorService.checkIn(ctx, "n1", { code: "ab2c3d4e5f6g" })).rejects.toMatchObject({ code: "conflict" })
  })

  it("counts walk-ins with no ticket", async () => {
    const result = await doorService.checkIn(ctx, "n1", { walkIn: true, partySize: 3 })
    expect(repo.addArrival).toHaveBeenCalledWith(ctx.supabase, { event_night_id: "n1", venue_id: "v1", party_size: 3 })
    expect(result).toMatchObject({ status: "in", name: "Walk-in", partySize: 3 })
  })
})

describe("doorService.selfCheckIn", () => {
  const page = { nightId: "n1", venueId: "v1", status: "published", startsAt: "2026-10-20T20:00:00Z" }

  beforeEach(() => {
    readEventPage.mockResolvedValue(page)
    repo.addSelfArrival.mockResolvedValue(null)
  })

  it("counts a guest from an hour before the start to six hours after", async () => {
    await doorService.selfCheckIn({} as never, "s", 2, new Date("2026-10-20T19:05:00Z"))
    expect(repo.addSelfArrival).toHaveBeenCalledWith({}, { event_night_id: "n1", venue_id: "v1", party_size: 2 })
  })

  it("is closed before and after that window, and for a cancelled night", async () => {
    await expect(doorService.selfCheckIn({} as never, "s", 1, new Date("2026-10-20T18:00:00Z"))).rejects.toMatchObject({
      code: "conflict",
    })
    await expect(doorService.selfCheckIn({} as never, "s", 1, new Date("2026-10-21T03:00:00Z"))).rejects.toMatchObject({
      code: "conflict",
    })
    readEventPage.mockResolvedValue({ ...page, status: "cancelled" })
    await expect(doorService.selfCheckIn({} as never, "s", 1, new Date("2026-10-20T20:00:00Z"))).rejects.toMatchObject({
      code: "conflict",
    })
    readEventPage.mockResolvedValue({ ...page, paused: true })
    await expect(doorService.selfCheckIn({} as never, "s", 1, new Date("2026-10-20T20:00:00Z"))).rejects.toMatchObject({
      message: "This venue is not taking check-ins right now.",
    })
    expect(repo.addSelfArrival).not.toHaveBeenCalled()
  })
})

describe("doorService.ticketForStaff", () => {
  it("shows a ticket's guest to the venue's team, and nothing to anyone RLS hides it from", async () => {
    expect(await doorService.ticketForStaff({} as never, "n1", "ab2c3d4e5f6g")).toEqual({
      nightId: "n1",
      name: "Ada",
      partySize: 2,
      arrivedAt: null,
    })
    repo.rsvpByCode.mockResolvedValue(null)
    expect(await doorService.ticketForStaff({} as never, "n1", "ab2c3d4e5f6g")).toBeNull()
  })

  it("shows a signed-out guest their own ticket, though the database refuses them the guest list", async () => {
    repo.rsvpByCode.mockRejectedValueOnce(forbidden())
    expect(await doorService.ticketForStaff({} as never, "n1", "ab2c3d4e5f6g")).toBeNull()
  })

  it("still reports a real failure", async () => {
    repo.rsvpByCode.mockRejectedValueOnce(new Error("database down"))
    await expect(doorService.ticketForStaff({} as never, "n1", "ab2c3d4e5f6g")).rejects.toThrow("database down")
  })
})

describe("doorService.logSpend", () => {
  it("is for owners and managers, and stores hundredths of the currency", async () => {
    await doorService.logSpend(ctx, "n1", 1820.5)
    expect(managedVenue).toHaveBeenCalledWith(ctx, "v1")
    expect(repo.saveSpend).toHaveBeenCalledWith(ctx.supabase, "n1", "v1", 182050)
  })
})
