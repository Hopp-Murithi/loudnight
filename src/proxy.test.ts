import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const refreshSession = vi.fn()
vi.mock("@/lib/supabase/proxy", () => ({ refreshSession: () => refreshSession() }))

const { proxy, config } = await import("./proxy")

const signedIn = () =>
  refreshSession.mockResolvedValue({ claims: { sub: "u1" }, getResponse: () => NextResponse.next() })

const signedOut = () => refreshSession.mockResolvedValue({ claims: null, getResponse: () => NextResponse.next() })

const visit = async (path: string, cookie?: string) => {
  const request = new NextRequest(new URL(path, "http://localhost:3000"), cookie ? { headers: { cookie } } : undefined)
  return (await proxy(request)).headers.get("location")
}

beforeEach(() => {
  refreshSession.mockReset()
})

describe("proxy, signed out", () => {
  it("sends people to sign in and remembers where they were going", async () => {
    signedOut()
    expect(await visit("/venues/abc")).toBe("http://localhost:3000/login?next=%2Fvenues%2Fabc")
    expect(await visit("/account")).toBe("http://localhost:3000/login?next=%2Faccount")
    expect(await visit("/admin/audit")).toBe("http://localhost:3000/login?next=%2Fadmin%2Faudit")
    expect(await visit("/set-password")).toBe("http://localhost:3000/login?next=%2Fset-password")
  })

  // Judges and guests never need an account: demo venues, event pages and the sign-in pages stay open.
  it("lets anyone reach the public and sign-in pages", async () => {
    signedOut()
    for (const path of ["/", "/demo/copper-room", "/e/afrobeats-tuesday-1", "/login", "/signup", "/auth/confirm"]) {
      expect(await visit(path)).toBeNull()
    }
    expect(await visit("/venuesque")).toBeNull()
  })

  it("leaves API routes to their own gate", async () => {
    signedOut()
    expect(await visit("/api/v1/me")).toBeNull()
  })
})

describe("proxy, signed in", () => {
  it("lets people into their venues", async () => {
    signedIn()
    expect(await visit("/venues")).toBeNull()
  })

  it("moves people off the sign-in pages", async () => {
    signedIn()
    expect(await visit("/login")).toBe("http://localhost:3000/venues")
    expect(await visit("/signup")).toBe("http://localhost:3000/venues")
  })

  it("keeps someone with a pending reset on the password form until it is saved", async () => {
    signedIn()
    const pending = "encore_password_pending=1"
    expect(await visit("/venues", pending)).toBe("http://localhost:3000/set-password")
    expect(await visit("/set-password", pending)).toBeNull()
    expect(await visit("/auth/confirm", pending)).toBeNull()
  })
})

describe("proxy matcher", () => {
  it("skips static files", () => {
    const runsOn = (path: string) => config.matcher.some((pattern) => new RegExp(`^${pattern}$`).test(path))
    expect(runsOn("/icon.svg")).toBe(false)
    expect(runsOn("/logo.svg")).toBe(false)
    expect(runsOn("/venues")).toBe(true)
  })
})
