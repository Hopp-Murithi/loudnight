import { describe, expect, it } from "vitest"
import { cityOf, genericRequest, tidyGenericAnswer } from "./runs.generic"

const venue = {
  name: "Sample Bar",
  venueType: "music_venue",
  address: "214 Bedford Ave, Brooklyn, NY 11249, USA",
  weekday: "tuesday" as const,
}

describe("genericRequest", () => {
  it("tells the model only what a plain chatbot would know: no tools, no Qloo, no gap scan", () => {
    const request = genericRequest(venue)
    expect(request).not.toHaveProperty("tools")
    expect(request).not.toHaveProperty("system")
    const prompt = request.messages[0].content
    expect(prompt).toContain("Sample Bar")
    expect(prompt).toContain("Brooklyn, NY")
    expect(prompt).toContain("Tuesdays")
    expect(prompt).not.toMatch(/qloo|affinity|urn:|signal/i)
  })
})

describe("cityOf", () => {
  it("keeps the city and state, drops the street and zip", () => {
    expect(cityOf(venue.address)).toBe("Brooklyn, NY")
  })
})

describe("tidyGenericAnswer", () => {
  it("removes long dashes and caps the length", () => {
    const answer = tidyGenericAnswer(`Trivia night ${String.fromCharCode(0x2014)} every week`)
    expect(answer).toBe("Trivia night, every week")
    expect(tidyGenericAnswer("x".repeat(9000))).toHaveLength(8000)
    expect(tidyGenericAnswer("## Ideas\n1. **Pool league:** weekly")).toBe("Ideas\n1. Pool league: weekly")
  })
})
