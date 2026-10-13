import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { AppError } from "./errors"
import { fetchUpstream, retryDelayMs } from "./upstream"

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

  it("retries once after a rate limit when asked to", async () => {
    vi.useFakeTimers()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 429, headers: { "retry-after": "0" } }))
      .mockResolvedValueOnce(Response.json({ results: ["b"] }))
    vi.stubGlobal("fetch", fetchMock)
    const pending = fetchUpstream({
      service: "Qloo",
      url: "https://example.test/x",
      timeoutMs: 50,
      schema,
      retryOnRateLimit: true,
    })
    await vi.runAllTimersAsync()
    expect(await pending).toEqual({ results: ["b"] })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it("fails when the rate limit holds after the retry", async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 429 })),
    )
    const pending = fetchUpstream({
      service: "Qloo",
      url: "https://example.test/x",
      timeoutMs: 50,
      schema,
      retryOnRateLimit: true,
    })
    const settled = pending.catch((caught: unknown) => caught)
    await vi.runAllTimersAsync()
    expect(await settled).toMatchObject({ code: "upstream_failed" })
    vi.useRealTimers()
  })

  it("does not retry a rate limit unless asked", async () => {
    const fetchMock = vi.fn(async () => new Response("", { status: 429 }))
    vi.stubGlobal("fetch", fetchMock)
    await expect(call()).rejects.toMatchObject({ code: "upstream_failed" })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("returns the empty value for a status that means no results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 404 })),
    )
    const result = await fetchUpstream({
      service: "Qloo",
      url: "https://example.test/x",
      timeoutMs: 50,
      schema,
      emptyOn: { status: 404, value: { results: [] } },
    })
    expect(result).toEqual({ results: [] })
  })
})

describe("retryDelayMs", () => {
  it("reads seconds, caps long waits and defaults to one second", () => {
    expect(retryDelayMs("2")).toBe(2000)
    expect(retryDelayMs("120")).toBe(5000)
    expect(retryDelayMs(null)).toBe(1000)
    expect(retryDelayMs("soon")).toBe(1000)
  })
})
