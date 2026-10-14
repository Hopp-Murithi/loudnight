import { beforeEach, describe, expect, it, vi } from "vitest"
import { COUNTRIES, countryOr, flagOf, isCountryCode, VENUE_PLACE_TYPES } from "@/config/countries"
import { placeSearchSchema } from "./venues.schemas"

const autocompletePlaces = vi.fn()
const placeForVenue = vi.fn()
vi.mock("@/lib/places/client", () => ({ autocompletePlaces, placeForVenue }))

const { pickVenuePlace, searchVenuePlaces } = await import("./venues.search")

// Made-up suggestions in the shape Google returns them.
const suggestion = (placeId: string, name: string, types: string[]) => ({
  placePrediction: {
    placeId,
    types,
    structuredFormat: { mainText: { text: name }, secondaryText: { text: "Sample Road, Nairobi, Kenya" } },
  },
})
const session = "00000000-0000-4000-8000-000000000000"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("searchVenuePlaces", () => {
  it("asks only inside the chosen country, and only for the kinds of place a venue is", async () => {
    autocompletePlaces.mockResolvedValue({ suggestions: [suggestion("p1", "Sample Lounge", ["night_club", "bar"])] })
    const result = await searchVenuePlaces({ query: "sample", country: "KE", session })
    expect(autocompletePlaces).toHaveBeenCalledWith({
      text: "sample",
      country: "KE",
      session,
      types: VENUE_PLACE_TYPES,
    })
    expect(result).toEqual({
      places: [{ placeId: "p1", name: "Sample Lounge", detail: "Sample Road, Nairobi, Kenya", kind: "Night club" }],
      broadened: false,
    })
  })

  it("shows every kind of place in the country when no venue matches, and says so", async () => {
    autocompletePlaces
      .mockResolvedValueOnce({ suggestions: [] })
      .mockResolvedValueOnce({ suggestions: [suggestion("p2", "Sample Hall", ["point_of_interest", "event_venue"])] })
    const result = await searchVenuePlaces({ query: "sample", country: "KE", session })
    expect(autocompletePlaces.mock.calls[1][0]).toEqual({ text: "sample", country: "KE", session })
    expect(result.broadened).toBe(true)
    expect(result.places[0].kind).toBe("Event venue")
  })
})

describe("pickVenuePlace", () => {
  it("is not found when Google has no address for the place", async () => {
    placeForVenue.mockResolvedValue({ id: "p3", displayName: { text: "No address" } })
    await expect(pickVenuePlace("p3", session)).rejects.toMatchObject({ code: "not_found" })
  })
})

describe("countries", () => {
  it("names every country and draws its flag", () => {
    expect(COUNTRIES.length).toBeGreaterThan(230)
    expect(COUNTRIES.find((country) => country.code === "KE")).toMatchObject({ name: "Kenya", flag: "🇰🇪" })
    expect(flagOf("gb")).toBe("🇬🇧")
  })

  it("starts from the visitor's country, or the United States when it is unknown", () => {
    expect(countryOr("ke")).toBe("KE")
    expect(countryOr("ZZ")).toBe("US")
    expect(countryOr(null)).toBe("US")
    expect(isCountryCode("ke")).toBe(false)
  })

  it("refuses a search without a real country", () => {
    expect(placeSearchSchema.safeParse({ query: "sample", country: "KE", session }).success).toBe(true)
    expect(placeSearchSchema.safeParse({ query: "sample", country: "ZZ", session }).success).toBe(false)
  })
})
