import { describe, expect, it, vi } from "vitest"

vi.mock("@/modules/auth/server/identity", () => ({ signInStatuses: vi.fn() }))
vi.mock("./admin-detail.repository", () => ({ adminDetailRepository: {} }))

const { signInState } = await import("./admin.detail")

describe("signInState", () => {
  it("tells joined people from invited ones who never came, and guests without an email", () => {
    const status = (lastSignInAt: string | null, invitedAt: string | null) => ({
      lastSignInAt,
      invitedAt,
      confirmed: true,
    })
    expect(signInState(false, status("2026-10-14T10:00:00Z", "2026-10-13T10:00:00Z"))).toBe("joined")
    expect(signInState(false, status(null, "2026-10-13T10:00:00Z"))).toBe("invited")
    expect(signInState(false, status(null, null))).toBe("not_signed_in")
    expect(signInState(false, undefined)).toBe("not_signed_in")
    expect(signInState(true, status("2026-10-14T10:00:00Z", null))).toBe("guest")
  })
})
