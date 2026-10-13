import { beforeEach, describe, expect, it, vi } from "vitest"
import { placeDetails, placesNearby } from "@/lib/places/client"
import { eventsNear } from "@/lib/ticketmaster/client"
import { findGap, scoutVenue } from "./gap.service"
import { coveredThemes } from "./gap.themes"

vi.mock("@/lib/places/client", () => ({ placesNearby: vi.fn(), placeDetails: vi.fn() }))
vi.mock("@/lib/ticketmaster/client", () => ({ eventsNear: vi.fn() }))
vi.mock("./gap.themes", () => ({ coveredThemes: vi.fn() }))

const venue = {
  placeId: "self",
  point: { latitude: 40.7174, longitude: -73.9575 },
  radiusMetres: 2000,
  timeZone: "America/New_York",
  weekday: "tuesday" as const,
}
const now = new Date("2026-10-13T12:00:00Z")
const place = { id: "p1", displayName: { text: "Sample Pub" }, location: { latitude: 40.718, longitude: -73.9575 } }
const event = { id: "e1", name: "Sample Trivia", dates: { start: { localDate: "2026-10-13" } } }
const trivia = [{ theme: "Trivia", examples: ["Sample Trivia"], count: 1 }]

beforeEach(() => {
  vi.mocked(placesNearby).mockReset().mockResolvedValue([place])
  vi.mocked(eventsNear).mockReset().mockResolvedValue([event])
  vi.mocked(coveredThemes).mockReset().mockResolvedValue(trivia)
})

describe("findGap", () => {
  it("searches four target nights and reads the themes", async () => {
    const scan = await findGap(venue, undefined, now)
    expect(eventsNear).toHaveBeenCalledTimes(4)
    expect(scan.nights).toEqual(["2026-10-13", "2026-10-20", "2026-10-27", "2026-11-03"])
    expect(scan.events).toHaveLength(1)
    expect(scan).toMatchObject({ themes: trivia, noveltyNeutral: false, sources: { places: "ok", events: "ok" } })
  })

  it("keeps going on events alone when Places is down", async () => {
    vi.mocked(placesNearby).mockRejectedValue(new Error("down"))
    const scan = await findGap(venue, undefined, now)
    expect(scan.sources).toEqual({ places: "failed", events: "ok", themes: "ok" })
    expect(scan.venues).toEqual([])
    expect(scan.noveltyNeutral).toBe(false)
  })

  it("keeps going on venues alone when Ticketmaster is down", async () => {
    vi.mocked(eventsNear).mockRejectedValue(new Error("down"))
    const scan = await findGap(venue, undefined, now)
    expect(scan.sources.events).toBe("failed")
    expect(scan.venues).toHaveLength(1)
  })

  it("flags neutral novelty and skips the planner when both are down", async () => {
    vi.mocked(placesNearby).mockRejectedValue(new Error("down"))
    vi.mocked(eventsNear).mockRejectedValue(new Error("down"))
    const scan = await findGap(venue, undefined, now)
    expect(scan.noveltyNeutral).toBe(true)
    expect(scan.sources.themes).toBe("failed")
    expect(coveredThemes).not.toHaveBeenCalled()
  })
})

describe("scoutVenue", () => {
  it("returns nothing for a venue without a Places id, and survives a Places outage", async () => {
    expect(await scoutVenue(null)).toBeNull()
    vi.mocked(placeDetails).mockRejectedValue(new Error("down"))
    expect(await scoutVenue("p")).toBeNull()
  })
})
