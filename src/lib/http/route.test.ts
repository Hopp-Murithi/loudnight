import type { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { forbidden, unauthorized } from "./errors"

const getApiContext = vi.fn()
vi.mock("@/modules/auth/server/context", () => ({ getApiContext: (roles?: string[]) => getApiContext(roles) }))

const serverSupabase = { from: vi.fn() }
vi.mock("@/lib/supabase/server", () => ({ createServerSupabase: async () => serverSupabase }))

const { apiRoute, apiStreamRoute, publicApiRoute } = await import("./route")

const request = (body?: unknown) =>
  ({ json: () => (body === undefined ? Promise.reject(new Error("no body")) : Promise.resolve(body)) }) as NextRequest
const route = { params: Promise.resolve({}) }

beforeEach(() => {
  getApiContext.mockReset()
})

describe("apiRoute", () => {
  it("wraps results in a data envelope", async () => {
    getApiContext.mockResolvedValue({ user: { id: "u1" } })
    const response = await apiRoute({}, async () => ({ ok: true }))(request(), route)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ data: { ok: true } })
  })

  it("returns 401 without a session", async () => {
    getApiContext.mockImplementation(async () => {
      throw unauthorized()
    })
    const response = await apiRoute({}, async () => "never")(request(), route)

    expect(response.status).toBe(401)
    expect((await response.json()).error.code).toBe("unauthorized")
  })

  it("returns 403 when the role is not allowed", async () => {
    getApiContext.mockImplementation(async () => {
      throw forbidden()
    })
    const response = await apiRoute({ roles: ["administrator"] }, async () => "never")(request(), route)

    expect(response.status).toBe(403)
    expect(getApiContext).toHaveBeenCalledWith(["administrator"])
  })

  it("returns 422 with field errors for an invalid body", async () => {
    getApiContext.mockResolvedValue({ user: { id: "u1" } })
    const handler = vi.fn()
    const response = await apiRoute({ body: z.object({ name: z.string().min(2) }) }, handler)(
      request({ name: "x" }),
      route,
    )

    expect(response.status).toBe(422)
    expect((await response.json()).error.details.name).toBeDefined()
    expect(handler).not.toHaveBeenCalled()
  })

  it("hides unexpected failures behind a generic 500", async () => {
    getApiContext.mockResolvedValue({ user: { id: "u1" } })
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const response = await apiRoute({}, async () => {
      throw new Error("db password is hunter2")
    })(request(), route)

    expect(response.status).toBe(500)
    expect(JSON.stringify(await response.json())).not.toMatch(/hunter2/)
  })
})

describe("apiStreamRoute", () => {
  const LINE = '{"step":"scout"}'

  it("returns the handler's stream as newline-delimited JSON", async () => {
    getApiContext.mockResolvedValue({ user: { id: "u1" } })
    const response = await apiStreamRoute({}, async () => new Response(LINE).body as ReadableStream<Uint8Array>)(
      request(),
      route,
    )

    expect(response.headers.get("Content-Type")).toBe("application/x-ndjson")
    expect(await response.text()).toBe(LINE)
  })

  it("refuses before streaming when nobody is signed in", async () => {
    getApiContext.mockImplementation(async () => {
      throw unauthorized()
    })
    const handler = vi.fn()
    const response = await apiStreamRoute({}, handler)(request(), route)

    expect(response.status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })
})

describe("publicApiRoute", () => {
  it("needs no session and hands the handler a client that acts as the caller", async () => {
    const handler = vi.fn(async ({ supabase }: { supabase: unknown }) => supabase === serverSupabase)
    const response = await publicApiRoute({}, handler)(request(), route)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ data: true })
    expect(getApiContext).not.toHaveBeenCalled()
  })

  it("still validates the body", async () => {
    const handler = vi.fn()
    const response = await publicApiRoute({ body: z.object({ guestName: z.string().min(1) }) }, handler)(
      request({ guestName: "" }),
      route,
    )

    expect(response.status).toBe(422)
    expect(handler).not.toHaveBeenCalled()
  })
})
