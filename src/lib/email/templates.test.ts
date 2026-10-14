import { describe, expect, it } from "vitest"
import { emailTemplates } from "./templates"

const URL_WITH_TOKEN = "https://encore.test/auth/confirm?token_hash=abc&type=signup"

describe("emailTemplates", () => {
  it("puts the link in both the HTML and the plain text", () => {
    const email = emailTemplates.verifyEmail({ name: "Ada", url: URL_WITH_TOKEN })

    expect(email.subject).toBe("Confirm your email for Loudnight")
    expect(email.html).toContain("token_hash=abc&amp;type=signup")
    expect(email.text).toContain(URL_WITH_TOKEN)
  })

  // A name typed at sign up must never become markup in someone's inbox.
  it("escapes everything a person typed", () => {
    const email = emailTemplates.verifyEmail({ name: '<script>alert("x")</script>', url: URL_WITH_TOKEN })

    expect(email.html).not.toContain("<script>")
    expect(email.html).toContain("&lt;script&gt;")
  })

  it("names the venue, the inviter and the role in an invite", () => {
    const email = emailTemplates.teamInvite({
      venueName: "The Copper Room",
      inviterName: "Ada",
      roleLabel: "door staff",
      url: URL_WITH_TOKEN,
    })

    expect(email.subject).toBe("Ada added you to The Copper Room on Loudnight")
    expect(email.text).toContain("as door staff")
  })

  it("offers sign in and reset when the address already has an account", () => {
    const email = emailTemplates.accountExists({
      signInUrl: "https://encore.test/login",
      resetUrl: "https://encore.test/forgot-password",
    })

    expect(email.text).toContain("Sign in: https://encore.test/login")
    expect(email.text).toContain("https://encore.test/forgot-password")
  })

  it("never uses long dashes", () => {
    const all = [
      emailTemplates.verifyEmail({ name: "A", url: URL_WITH_TOKEN }),
      emailTemplates.passwordReset({ url: URL_WITH_TOKEN }),
      emailTemplates.verifyAgain({ url: URL_WITH_TOKEN }),
    ]
    const longDashes = new RegExp(`[${String.fromCharCode(8211, 8212)}]`)
    all.forEach((email) => expect(email.text).not.toMatch(longDashes))
  })
})
