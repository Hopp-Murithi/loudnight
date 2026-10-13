import { describe, expect, it } from "vitest"
import { initials, plainDashes } from "./text"

const EM = String.fromCharCode(0x2014)
const EN = String.fromCharCode(0x2013)

describe("plainDashes", () => {
  it("turns long dashes into commas and leaves hyphens alone", () => {
    expect(plainDashes(`Live jazz ${EM} every week`)).toBe("Live jazz, every week")
    expect(plainDashes(`Doors 8${EN}11`)).toBe("Doors 8 to 11")
    expect(plainDashes("Stand-up night")).toBe("Stand-up night")
  })
})

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Sam Rivera")).toBe("SR")
    expect(initials("encore")).toBe("E")
    expect(initials("  Ada  Lovelace King ")).toBe("AL")
  })
})
