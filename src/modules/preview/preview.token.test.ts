import { describe, expect, it } from "vitest"
import { readPreview, signPreview } from "./preview.token"

const secret = "a-test-secret-that-is-long-enough-123"
const now = 1_000_000

describe("preview token", () => {
  it("reads back what it signed until it expires", () => {
    const token = signPreview({ target: "u1", exp: now + 60_000 }, secret)
    expect(readPreview(token, secret, now)).toEqual({ target: "u1", exp: now + 60_000 })
    expect(readPreview(token, secret, now + 60_001)).toBeNull()
  })

  it("refuses a tampered, forged or malformed cookie", () => {
    const token = signPreview({ target: "u1", exp: now + 60_000 }, secret)
    const [, mac] = token.split(".")
    const other = Buffer.from(JSON.stringify({ target: "u2", exp: now + 60_000 })).toString("base64url")
    expect(readPreview(`${other}.${mac}`, secret, now)).toBeNull()
    expect(readPreview(token, "another-secret-entirely-different-0000", now)).toBeNull()
    expect(readPreview("nonsense", secret, now)).toBeNull()
    expect(readPreview(undefined, secret, now)).toBeNull()
  })
})
