import { describe, expect, it } from "vitest"
import { safeNextPath } from "./site"

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/venues/abc")).toBe("/venues/abc")
  })

  it("refuses anything that could leave the site", () => {
    expect(safeNextPath("//evil.example")).toBeNull()
    expect(safeNextPath("/\\evil.example")).toBeNull()
    expect(safeNextPath("https://evil.example")).toBeNull()
    expect(safeNextPath(null)).toBeNull()
    expect(safeNextPath("")).toBeNull()
  })
})
