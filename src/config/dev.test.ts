import { describe, expect, it } from "vitest"
import { devToolsEnabled } from "./dev"

describe("devToolsEnabled", () => {
  it("is off in production so the gallery is a 404 there", () => {
    expect(devToolsEnabled("production")).toBe(false)
  })

  it("is on in development and tests", () => {
    expect(devToolsEnabled("development")).toBe(true)
    expect(devToolsEnabled("test")).toBe(true)
  })
})
