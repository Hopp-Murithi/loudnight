import { beforeEach, describe, expect, it, vi } from "vitest"
import type { RequestContext } from "@/modules/auth/types"

const getDetail = vi.fn()
const findMembership = vi.fn()
const findAccount = vi.fn()
const createInvite = vi.fn()
const createAccountLink = vi.fn()
const add = vi.fn()
const sendEmail = vi.fn()

vi.mock("@/modules/venues/venues.service", () => ({
  venuesService: { getDetail: (...a: unknown[]) => getDetail(...a) },
}))
vi.mock("@/modules/venues/venues.repository", () => ({
  venuesRepository: { findMembership: (...a: unknown[]) => findMembership(...a) },
}))
vi.mock("@/modules/auth/server/identity", () => ({
  findAccount: (...a: unknown[]) => findAccount(...a),
  createInvite: (...a: unknown[]) => createInvite(...a),
  createAccountLink: (...a: unknown[]) => createAccountLink(...a),
}))
vi.mock("./team.repository", () => ({ teamRepository: { add: (...a: unknown[]) => add(...a) } }))
vi.mock("@/lib/email/mailer", () => ({ sendEmail: (m: unknown) => sendEmail(m) }))

const { teamService } = await import("./team.service")

const ctx = {
  user: { id: "owner-1", displayName: "Ada", email: "ada@example.com", role: "owner", isAnonymous: false },
  supabase: {},
} as unknown as RequestContext

beforeEach(() => {
  ;[getDetail, findMembership, findAccount, createInvite, createAccountLink, add, sendEmail].forEach((mock) =>
    mock.mockReset(),
  )
  createAccountLink.mockResolvedValue("https://encore.test/auth/confirm?token_hash=r&type=recovery")
  getDetail.mockResolvedValue({ id: "v1", name: "Union Pool", role: "owner" })
})

describe("teamService.invite", () => {
  it("creates an account for a new address, adds them and sends the invitation", async () => {
    findAccount.mockResolvedValue(null)
    createInvite.mockResolvedValue({
      userId: "new-1",
      url: "https://encore.test/auth/confirm?token_hash=x&type=invite",
    })

    await expect(teamService.invite(ctx, "v1", { email: "sam@example.com", role: "door" })).resolves.toEqual({
      status: "invited",
    })
    expect(add).toHaveBeenCalledWith(ctx.supabase, "v1", "new-1", "door", "owner-1")
    expect(sendEmail.mock.calls[0][0].subject).toBe("Ada added you to Union Pool on Loudnight")
  })

  it("adds an existing account without creating another, with a link to choose a password", async () => {
    findAccount.mockResolvedValue({ id: "user-2", confirmed: true })
    findMembership.mockResolvedValue(null)

    await expect(teamService.invite(ctx, "v1", { email: "lee@example.com", role: "manager" })).resolves.toEqual({
      status: "added",
    })
    expect(createInvite).not.toHaveBeenCalled()
    expect(createAccountLink).toHaveBeenCalledWith("lee@example.com", "recovery")
    expect(sendEmail.mock.calls[0][0].subject).toBe("You now work at Union Pool on Loudnight")
    expect(sendEmail.mock.calls[0][0].text).toContain("type=recovery")
  })

  // Nothing is created for someone who is not the owner, so the endpoint cannot be used to make accounts.
  it("refuses anyone but the owner before creating anything", async () => {
    getDetail.mockResolvedValue({ id: "v1", name: "Union Pool", role: "manager" })

    await expect(teamService.invite(ctx, "v1", { email: "sam@example.com", role: "door" })).rejects.toMatchObject({
      status: 403,
    })
    expect(findAccount).not.toHaveBeenCalled()
    expect(createInvite).not.toHaveBeenCalled()
  })

  it("sends someone already on the team a fresh link instead of adding them twice", async () => {
    findAccount.mockResolvedValue({ id: "user-2", confirmed: false })
    findMembership.mockResolvedValue({ role: "door" })
    await expect(teamService.invite(ctx, "v1", { email: "lee@example.com", role: "door" })).resolves.toEqual({
      status: "resent",
    })
    expect(add).not.toHaveBeenCalled()
    expect(sendEmail.mock.calls[0][0].text).toContain("Loudnight Door app")
  })

  it("refuses to invite you to your own team", async () => {
    await expect(teamService.invite(ctx, "v1", { email: "ada@example.com", role: "door" })).rejects.toMatchObject({
      message: "You are already on this team.",
    })
    expect(sendEmail).not.toHaveBeenCalled()
  })
})
