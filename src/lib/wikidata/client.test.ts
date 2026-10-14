import { afterEach, describe, expect, it, vi } from "vitest"
import { AppError } from "@/lib/http/errors"
import { artistsFrom } from "@/lib/musicbrainz/client"
import { sparql } from "./client"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const answer = (body: unknown, status = 200) => vi.fn(async () => Response.json(body, { status }))

describe("open data clients", () => {
  it("returns Wikidata rows as plain values and names the caller", async () => {
    const fetch = answer({ results: { bindings: [{ p: { type: "uri", value: "x" }, links: { value: "3" } }] } })
    vi.stubGlobal("fetch", fetch)
    expect(await sparql("SELECT ?p WHERE {}")).toEqual([{ p: "x", links: "3" }])
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain("query=SELECT%20%3Fp")
    expect((init.headers as Record<string, string>)["User-Agent"]).toMatch(/^Loudnight\//)
  })

  it("turns a refusal or an odd answer into a safe upstream error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    vi.stubGlobal("fetch", answer({ error: "busy" }, 500))
    await expect(sparql("SELECT")).rejects.toBeInstanceOf(AppError)
    vi.stubGlobal("fetch", answer({ unexpected: true }))
    await expect(artistsFrom("Nairobi", 5)).rejects.toBeInstanceOf(AppError)
  })

  it("asks MusicBrainz for a town without letting quotes break the query", async () => {
    const fetch = answer({ artists: [{ id: "a", name: "Sample Band" }] })
    vi.stubGlobal("fetch", fetch)
    expect(await artistsFrom('Ny"eri', 5)).toEqual([{ id: "a", name: "Sample Band" }])
    const [url] = fetch.mock.calls[0] as unknown as [string]
    expect(decodeURIComponent(url)).toContain('(area:"Nyeri" OR beginarea:"Nyeri")')
  })
})
