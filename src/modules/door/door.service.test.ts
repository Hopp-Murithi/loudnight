import { beforeEach, describe, expect, it, vi } from "vitest"
import { forbidden } from "@/lib/http/errors"
import type { RequestContext } from "@/modules/auth/types"

const repo = {
  arrivalByKey: vi.fn(),
  findNight: vi.fn(),
  timeZone: vi.fn(),
  rsvpByCode: vi.fn(),
  rsvpById: vi.fn(),
  arrivalOf: vi.fn(),
  addArrival: vi.fn(),
  saveSpend: vi.fn(),
}
const managedVenue = vi.fn()

vi.mock("./door.repository", () => ({ doorRepository: repo }))
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
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date("2026-10-20T20:10:00Z"))
  repo.findNight.mockResolvedValue(night)
  repo.timeZone.mockResolvedValue("America/Chicago")
  repo.rsvpByCode.mockResolvedValue(ada)
  repo.arrivalOf.mockResolvedValue(null)
  repo.addArrival.mockResolvedValue({ at: "2026-10-20T20:14:00Z", failure: null })
})

describe("doorService.checkIn", () => {
  it("lets no one in before the night's day or after it is over, and not for a night that is not on", async () => {
    vi.setSystemTime(new Date("2026-10-19T20:00:00Z"))
    await expect(doorService.checkIn(ctx, "n1", { code: "ab2c3d4e5f6g" })).rejects.toMatchObject({
      message: "Check-in opens on the day of the night.",
    })
    vi.setSystemTime(new Date("2026-10-21T05:00:00Z"))
    await expect(doorService.checkIn(ctx, "n1", { walkIn: true, partySize: 1 })).rejects.toMatchObject({
      code: "conflict",
    })
    vi.setSystemTime(new Date("2026-10-20T20:10:00Z"))
    repo.findNight.mockResolvedValue({ ...night, status: "cancelled" })
    await expect(doorService.checkIn(ctx, "n1", { code: "ab2c3d4e5f6g" })).rejects.toMatchObject({ code: "conflict" })
    expect(repo.addArrival).not.toHaveBeenCalled()
  })

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
    expect(repo.addArrival).toHaveBeenCalledWith(ctx.supabase, {
      event_night_id: "n1",
      venue_id: "v1",
      party_size: 3,
      client_key: undefined,
    })
    expect(result).toMatchObject({ status: "in", name: "Walk-in", partySize: 3 })
  })

  it("counts a walk-in the door app sends twice only once", async () => {
    repo.addArrival.mockResolvedValueOnce({ at: null, failure: "23505" })
    repo.arrivalByKey.mockResolvedValueOnce({ created_at: "2026-10-20T20:05:00Z", party_size: 2 })
    const key = "00000000-0000-4000-8000-0000000000aa"
    const result = await doorService.checkIn(ctx, "n1", { walkIn: true, partySize: 2, clientKey: key })
    expect(repo.arrivalByKey).toHaveBeenCalledWith(ctx.supabase, "n1", key)
    expect(result).toMatchObject({ status: "in", at: "2026-10-20T20:05:00Z" })
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
