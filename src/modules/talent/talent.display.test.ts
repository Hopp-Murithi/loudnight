import { describe, expect, it } from "vitest"
import { listenersText, mailtoLink, matchLabel } from "./talent.display"

describe("matchLabel", () => {
  it("says what the overlap means before the owner reads the number", () => {
    expect(matchLabel(0.94)).toBe("Very strong crowd match")
    expect(matchLabel(0.8)).toBe("Strong crowd match")
    expect(matchLabel(0.6)).toBe("Good crowd match")
  })
})

describe("listenersText", () => {
  it("shortens big counts and says nothing when there is no count", () => {
    expect(listenersText(34543)).toBe("34.5K monthly listeners")
    expect(listenersText(null)).toBeNull()
    expect(listenersText(0)).toBeNull()
  })
})

describe("mailtoLink", () => {
  it("opens the owner's mail app with no address filled in, and escapes the message", () => {
    const link = mailtoLink("Playing Sample Night", "Hi there,\nare you free? We pay up to $300 & a meal.")
    expect(link.startsWith("mailto:?subject=Playing%20Sample%20Night&body=")).toBe(true)
    expect(link).toContain("%0A")
    expect(link).toContain("%26")
    expect(link).not.toContain(" ")
  })
})
