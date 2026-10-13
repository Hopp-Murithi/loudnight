import { describe, expect, it } from "vitest"
import { afterConfirm, confirmLinkUrl, needsPassword } from "./auth.links"

describe("confirmLinkUrl", () => {
  it("points at our confirm page, never straight at Supabase", () => {
    const url = new URL(confirmLinkUrl("https://encore.test", "hash123", "signup"))
    expect(url.origin + url.pathname).toBe("https://encore.test/auth/confirm")
    expect(url.searchParams.get("token_hash")).toBe("hash123")
    expect(url.searchParams.get("type")).toBe("signup")
  })
})

describe("after a link is confirmed", () => {
  it("sends sign-up and resent links straight to the venues", () => {
    expect(afterConfirm("signup")).toBe("/venues")
    expect(afterConfirm("magiclink")).toBe("/venues")
  })

  it("sends reset and invite links to choose a password", () => {
    expect(needsPassword("recovery")).toBe(true)
    expect(afterConfirm("invite")).toBe("/set-password")
  })
})
