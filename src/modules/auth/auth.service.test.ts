import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ServerSupabase } from "@/lib/supabase/server"

const createSignUpLink = vi.fn()
const createAccountLink = vi.fn()
const findAccount = vi.fn()
const sendEmail = vi.fn()

vi.mock("./server/identity", () => ({
  createSignUpLink: (...args: unknown[]) => createSignUpLink(...args),
  createAccountLink: (...args: unknown[]) => createAccountLink(...args),
  findAccount: (...args: unknown[]) => findAccount(...args),
}))
vi.mock("@/lib/email/mailer", () => ({ sendEmail: (message: unknown) => sendEmail(message) }))

const { authService } = await import("./auth.service")

const LINK = "https://encore.test/auth/confirm?token_hash=abc&type=signup"

beforeEach(() => {
  ;[createSignUpLink, createAccountLink, findAccount, sendEmail].forEach((mock) => mock.mockReset())
})

describe("signUp", () => {
  it("emails a confirmation link to a new address", async () => {
    createSignUpLink.mockResolvedValue({ status: "created", url: LINK })
    await authService.signUp({ displayName: "Ada", email: "ada@example.com", password: "quiet-night-7" })

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "ada@example.com", subject: "Confirm your email for Encore" }),
    )
    expect(sendEmail.mock.calls[0][0].text).toContain(LINK)
  })

  // The person who owns the address learns someone tried; the person signing up learns nothing.
  it("tells the owner of an existing address instead of creating a second account", async () => {
    createSignUpLink.mockResolvedValue({ status: "exists" })
    await authService.signUp({ displayName: "Ada", email: "ada@example.com", password: "quiet-night-7" })

    expect(sendEmail.mock.calls[0][0].subject).toBe("You already have an Encore account")
  })
})

describe("resendVerification", () => {
  it("sends a new link to an unconfirmed account", async () => {
    findAccount.mockResolvedValue({ id: "u1", confirmed: false })
    createAccountLink.mockResolvedValue(LINK)
    await authService.resendVerification("ada@example.com")

    expect(createAccountLink).toHaveBeenCalledWith("ada@example.com", "magiclink")
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it.each([
    ["has no account", null],
    ["is already confirmed", { id: "u1", confirmed: true }],
  ])("sends nothing when the address %s", async (_, account) => {
    findAccount.mockResolvedValue(account)
    await expect(authService.resendVerification("x@example.com")).resolves.toBeUndefined()
    expect(sendEmail).not.toHaveBeenCalled()
  })
})

describe("sendPasswordReset", () => {
  it("emails a reset link to a registered address", async () => {
    findAccount.mockResolvedValue({ id: "u1", confirmed: true })
    createAccountLink.mockResolvedValue(LINK)
    await authService.sendPasswordReset("ada@example.com")

    expect(createAccountLink).toHaveBeenCalledWith("ada@example.com", "recovery")
    expect(sendEmail.mock.calls[0][0].subject).toBe("Reset your Encore password")
  })

  it("sends nothing to an address that has no account, and says nothing about it", async () => {
    findAccount.mockResolvedValue(null)
    await expect(authService.sendPasswordReset("stranger@example.com")).resolves.toBeUndefined()
    expect(sendEmail).not.toHaveBeenCalled()
  })
})

describe("signIn", () => {
  const supabaseWith = (error: unknown) =>
    ({ auth: { signInWithPassword: vi.fn().mockResolvedValue({ error }) } }) as unknown as ServerSupabase

  it("signs in with the right password", async () => {
    await expect(authService.signIn(supabaseWith(null), { email: "a@b.co", password: "x" })).resolves.toBeUndefined()
  })

  it("says the email needs confirming, with its own error code", async () => {
    await expect(
      authService.signIn(supabaseWith({ code: "email_not_confirmed" }), { email: "a@b.co", password: "x" }),
    ).rejects.toMatchObject({ code: "email_not_verified", status: 403 })
  })

  it("never says which of email or password was wrong", async () => {
    await expect(
      authService.signIn(supabaseWith({ code: "invalid_credentials" }), { email: "a@b.co", password: "x" }),
    ).rejects.toMatchObject({ status: 401, message: "Incorrect email or password." })
  })
})

describe("confirmLink", () => {
  const supabaseWith = (error: unknown) =>
    ({ auth: { verifyOtp: vi.fn().mockResolvedValue({ error }) } }) as unknown as ServerSupabase

  it("sends a confirmed sign-up to the venues and a reset to the password form", async () => {
    await expect(authService.confirmLink(supabaseWith(null), "hash", "signup")).resolves.toBe("/venues")
    await expect(authService.confirmLink(supabaseWith(null), "hash", "recovery")).resolves.toBe("/set-password")
  })

  it("returns null for a used or expired link", async () => {
    await expect(authService.confirmLink(supabaseWith({ code: "otp_expired" }), "hash", "signup")).resolves.toBeNull()
  })
})
