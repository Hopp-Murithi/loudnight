import { describe, expect, it } from "vitest"
import { confirmLinkSchema, loginSchema, passwordSchema, signUpSchema } from "./auth.schemas"

describe("passwordSchema", () => {
  it("accepts 10 or more characters with a letter and a number", () => {
    expect(passwordSchema.safeParse("quiet-night-7").success).toBe(true)
  })

  it.each([
    ["too short", "short1"],
    ["no number", "no-numbers-here"],
    ["no letter", "1234567890"],
  ])("refuses a password with %s", (_, value) => {
    expect(passwordSchema.safeParse(value).success).toBe(false)
  })
})

describe("signUpSchema", () => {
  it("trims the name and lower-cases the email", () => {
    const parsed = signUpSchema.parse({ displayName: "  Ada  ", email: "Ada@Example.COM", password: "quiet-night-7" })
    expect(parsed).toEqual({ displayName: "Ada", email: "ada@example.com", password: "quiet-night-7" })
  })

  it("needs a name", () => {
    expect(signUpSchema.safeParse({ displayName: " ", email: "a@b.co", password: "quiet-night-7" }).success).toBe(false)
  })
})

describe("loginSchema", () => {
  it("never checks password rules at sign in, only that one was typed", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true)
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false)
  })
})

describe("confirmLinkSchema", () => {
  it("accepts only the link types Encore sends", () => {
    expect(confirmLinkSchema.safeParse({ token_hash: "a".repeat(20), type: "recovery" }).success).toBe(true)
    expect(confirmLinkSchema.safeParse({ token_hash: "a".repeat(20), type: "email_change" }).success).toBe(false)
  })
})
