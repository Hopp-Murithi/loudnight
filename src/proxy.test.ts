import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const refreshSession = vi.fn()
vi.mock("@/lib/supabase/proxy", () => ({ refreshSession: () => refreshSession() }))

const { proxy, config } = await import("./proxy")

const signedIn = () =>
  refreshSession.mockResolvedValue({
    claims: { sub: "u1", is_anonymous: true },
    getResponse: () => NextResponse.next(),
  })

const signedOut = () => refreshSession.mockResolvedValue({ claims: null, getResponse: () => NextResponse.next() })

const visit = async (path: string) => {
  const response = await proxy(new NextRequest(new URL(path, "http://localhost:3000")))
  return response.headers.get("location")
}

beforeEach(() => {
  refreshSession.mockReset()
})

describe("proxy", () => {
  it("sends visitors without a session to the start page and remembers where they were going", async () => {
    signedOut()
    expect(await visit("/venues/abc")).toBe("http://localhost:3000/start?next=%2Fvenues%2Fabc")
  })

  it("gates the account and admin areas the same way", async () => {
    signedOut()
    expect(await visit("/account")).toBe("http://localhost:3000/start?next=%2Faccount")
    expect(await visit("/admin/audit")).toBe("http://localhost:3000/start?next=%2Fadmin%2Faudit")
  })

  // Judges and guests never need an account: demo venues and event pages stay open.
  it("lets anyone reach the public pages", async () => {
    signedOut()
    expect(await visit("/")).toBeNull()
    expect(await visit("/demo/copper-room")).toBeNull()
    expect(await visit("/e/afrobeats-tuesday-1")).toBeNull()
    expect(await visit("/venuesque")).toBeNull()
  })

  it("leaves API routes to their own gate", async () => {
    signedOut()
    expect(await visit("/api/v1/me")).toBeNull()
  })

  it("lets an anonymous session into the owner area", async () => {
    signedIn()
    expect(await visit("/venues")).toBeNull()
  })

  it("skips static files", () => {
    const runsOn = (path: string) => config.matcher.some((pattern) => new RegExp(`^${pattern}$`).test(path))
    expect(runsOn("/icon.svg")).toBe(false)
    expect(runsOn("/logo.svg")).toBe(false)
    expect(runsOn("/venues")).toBe(true)
  })
})
