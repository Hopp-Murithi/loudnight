import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { qlooInsights, qlooSearch } from "./client"
import { tasteEntitiesRequest } from "./requests"

vi.mock("@/lib/env/server", () => ({
  qlooEnv: () => ({ QLOO_API_KEY: "test-key", QLOO_API_URL: "https://qloo.test" }),
}))

const request = tasteEntitiesRequest("urn:entity:artist", { latitude: 40.7174, longitude: -73.9575 })
const synthetic = { _synthetic: true, success: true, results: { entities: [] } }

const respond = (...responses: Response[]) => {
  const fetchMock = vi.fn()
  responses.forEach((response) => fetchMock.mockResolvedValueOnce(response))
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("qlooInsights", () => {
  it("sends the key in the header and the parameters in the query string", async () => {
    const fetchMock = respond(Response.json(synthetic))
    const result = await qlooInsights(request)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain("https://qloo.test/v2/insights?")
    expect(url).toContain("signal.location=POINT")
    expect(url).not.toContain("test-key")
    expect(init.headers).toMatchObject({ "X-Api-Key": "test-key" })
    expect(result.requestHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it.each([401, 403, 500])("turns a %d into a safe upstream failure", async (status) => {
    respond(new Response("", { status }))
    await expect(qlooInsights(request)).rejects.toMatchObject({ code: "upstream_failed" })
  })

  it("retries once after a rate limit, then answers", async () => {
    vi.useFakeTimers()
    const fetchMock = respond(new Response("", { status: 429 }), Response.json(synthetic))
    const pending = qlooInsights(request)
    await vi.runAllTimersAsync()
    await expect(pending).resolves.toMatchObject({ response: { success: true } })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("fails when the rate limit holds", async () => {
    vi.useFakeTimers()
    respond(new Response("", { status: 429 }), new Response("", { status: 429 }))
    const settled = qlooInsights(request).catch((caught: unknown) => caught)
    await vi.runAllTimersAsync()
    expect(await settled).toMatchObject({ code: "upstream_failed" })
  })

  it("treats success false as a failure", async () => {
    respond(Response.json({ _synthetic: true, success: false }))
    await expect(qlooInsights(request)).rejects.toMatchObject({ code: "upstream_failed" })
  })

  it("returns an empty list as data, not an error", async () => {
    respond(Response.json(synthetic))
    await expect(qlooInsights(request)).resolves.toMatchObject({ response: { results: { entities: [] } } })
  })
})

describe("qlooSearch", () => {
  it("reads a 404 as no matches", async () => {
    respond(new Response("", { status: 404 }))
    const result = await qlooSearch("Nobody", ["urn:entity:artist"])
    expect(result.response).toEqual({ results: [] })
  })
})
