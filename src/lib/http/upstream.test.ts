import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { AppError } from "./errors"
import { fetchUpstream } from "./upstream"

const schema = z.object({ results: z.array(z.string()) })
const call = () => fetchUpstream({ service: "Qloo", url: "https://example.test/x?key=secret", timeoutMs: 50, schema })

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("fetchUpstream", () => {
  it("returns the parsed body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ results: ["a"] })),
    )
    expect(await call()).toEqual({ results: ["a"] })
  })

  it("turns an error status into a 502 that names the service only", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("bad key secret", { status: 401 })),
    )
    const error = await call().catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(AppError)
    expect((error as AppError).status).toBe(502)
    expect((error as AppError).message).toBe("Qloo did not answer. Try again in a moment.")
  })

  it("refuses a body in an unexpected shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ results: "nope" })),
    )
    await expect(call()).rejects.toMatchObject({ code: "upstream_failed" })
  })

  it("gives up after the timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(init.signal?.reason))),
      ),
    )
    await expect(call()).rejects.toMatchObject({ code: "upstream_failed" })
  })

  it("never logs the URL, which can carry a key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 })),
    )
    await call().catch(() => undefined)
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toMatch(/secret/)
  })
})
