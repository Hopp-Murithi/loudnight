import { beforeEach, describe, expect, it, vi } from "vitest"
import type { RequestContext } from "@/modules/auth/types"

const repo = {
  venues: vi.fn(),
  people: vi.fn(),
  counts: vi.fn(),
  setSuspension: vi.fn(),
  findPerson: vi.fn(),
  setActive: vi.fn(),
}
const setSignInBlocked = vi.fn()
const record = vi.fn()

vi.mock("./admin.repository", async () => ({
  adminRepository: repo,
  searchTerm: (await vi.importActual<typeof import("./admin.repository")>("./admin.repository")).searchTerm,
}))
vi.mock("@/modules/auth/server/identity", () => ({ setSignInBlocked }))
vi.mock("@/modules/history/history.repository", () => ({ historyRepository: { record } }))
vi.mock("@/lib/supabase/admin", () => ({ createAdminSupabase: () => ({ service: true }) }))

const { adminService, adminVenues } = await import("./admin.service")
const { searchTerm } = await import("./admin.repository")

const ctx = { supabase: {}, user: { id: "admin-1" } } as unknown as RequestContext

beforeEach(() => {
  vi.clearAllMocks()
  repo.findPerson.mockResolvedValue({ id: "p1", role: "owner" })
  repo.setSuspension.mockResolvedValue(true)
})

describe("adminService.setPersonActive", () => {
  it("deactivates a person, blocks their sign-in and audits it as the administrator", async () => {
    expect(await adminService.setPersonActive(ctx, "p1", false)).toEqual({ active: false })
    expect(repo.setActive).toHaveBeenCalledWith({ service: true }, "p1", false)
    expect(setSignInBlocked).toHaveBeenCalledWith("p1", true)
    expect(record).toHaveBeenCalledWith(
      { service: true },
      expect.objectContaining({ actorId: "admin-1", action: "person.deactivated", subjectId: "p1" }),
    )
  })

  it("changes nothing when the sign-in block fails", async () => {
    setSignInBlocked.mockRejectedValueOnce(new Error("auth down"))
    await expect(adminService.setPersonActive(ctx, "p1", false)).rejects.toThrow("auth down")
    expect(repo.setActive).not.toHaveBeenCalled()
    expect(record).not.toHaveBeenCalled()
  })

  it("reactivates and lifts the block", async () => {
    await adminService.setPersonActive(ctx, "p1", true)
    expect(setSignInBlocked).toHaveBeenCalledWith("p1", false)
    expect(record.mock.calls[0][1].action).toBe("person.reactivated")
  })

  it("never deactivates the administrator acting, or another administrator", async () => {
    await expect(adminService.setPersonActive(ctx, "admin-1", false)).rejects.toMatchObject({ code: "conflict" })
    repo.findPerson.mockResolvedValue({ id: "a2", role: "administrator" })
    await expect(adminService.setPersonActive(ctx, "a2", false)).rejects.toMatchObject({ code: "conflict" })
    repo.findPerson.mockResolvedValue(null)
    await expect(adminService.setPersonActive(ctx, "nobody", false)).rejects.toMatchObject({ code: "not_found" })
    expect(repo.setActive).not.toHaveBeenCalled()
    expect(setSignInBlocked).not.toHaveBeenCalled()
  })
})

describe("venue suspension", () => {
  it("suspends with a reason and lifts with none, through the administrator's own session", async () => {
    await adminService.suspendVenue(ctx, "v1", "Fake events reported")
    expect(repo.setSuspension).toHaveBeenCalledWith(ctx.supabase, "v1", "Fake events reported")
    await adminService.liftVenue(ctx, "v1")
    expect(repo.setSuspension).toHaveBeenLastCalledWith(ctx.supabase, "v1", null)
  })

  it("says so when the venue is not there", async () => {
    repo.setSuspension.mockResolvedValue(false)
    await expect(adminService.suspendVenue(ctx, "v9", "Reason")).rejects.toMatchObject({ code: "not_found" })
  })
})

describe("lists", () => {
  it("shows a page of venues, says whether there are more, and names the place", async () => {
    const row = (id: string) => ({
      id,
      name: `Venue ${id}`,
      city: "Austin, TX",
      country_code: "US",
      address: "1 Sample St",
      venue_type: "restaurant",
      is_demo: false,
      created_at: "2026-10-14T00:00:00Z",
      suspended_at: null,
      suspended_reason: null,
    })
    repo.venues.mockResolvedValue(Array.from({ length: 26 }, (_, index) => row(String(index))))
    const page = await adminVenues({} as never, { q: "aus(tin", page: 2 })
    expect(repo.venues).toHaveBeenCalledWith({}, "austin", 2)
    expect(page).toMatchObject({ page: 2, hasMore: true })
    expect(page.rows).toHaveLength(25)
    expect(page.rows[0].place).toBe("Austin, TX, US")
  })

  it("keeps filter syntax out of a search", () => {
    expect(searchTerm("a,b%c*(d)")).toBe("abcd")
    expect(searchTerm("o'neil@bar.co")).toBe("o'neil@bar.co")
    expect(searchTerm(undefined)).toBe("")
  })
})
