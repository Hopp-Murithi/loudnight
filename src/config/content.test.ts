import { describe, expect, it } from "vitest"
import { isPresentableName } from "./content"

const slur = String.fromCharCode(110, 105, 103, 103, 97)

describe("isPresentableName", () => {
  it("hides names carrying a slur, whatever the case", () => {
    expect(isPresentableName(`Young ${slur}`)).toBe(false)
    expect(isPresentableName(slur.toUpperCase())).toBe(false)
  })

  it.each(["Niger", "Nigeria", "Donald Fagen", "Kike Pavón", "Niggle Street Band", "Chinkapin Oak", "Walker Lukens"])(
    "shows %s",
    (name) => {
      expect(isPresentableName(name)).toBe(true)
    },
  )
})
