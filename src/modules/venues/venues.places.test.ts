import { describe, expect, it } from "vitest"
import { currencyFor } from "@/config/currencies"
import { isTimeZone, zoneLabel } from "@/config/time-zones"
import { cityFromParts, countryFromParts, townOf } from "@/lib/address"
import { toPlaceOption, venueTypeFor } from "./venues.places"
import { toCents, venueOnboardingSchema } from "./venues.schemas"

// Address parts in the shape Google Places returns them. Made up, not copied from a response.
const parts = (country: string, town: [string, string], state?: string) => [
  { longText: town[1], shortText: town[1], types: [town[0], "political"] },
  ...(state ? [{ longText: state, shortText: state, types: ["administrative_area_level_1", "political"] }] : []),
  { longText: country, shortText: country, types: ["country", "political"] },
]

describe("venueTypeFor", () => {
  it.each([
    [["night_club", "bar"], "music_venue"],
    [["cocktail_bar", "establishment"], "bar"],
    [["coffee_shop"], "cafe"],
    [["italian_restaurant", "food"], "restaurant"],
    [["bar_and_grill"], "bar"],
    [["gym"], "other"],
  ])("maps %j to %s", (types, expected) => {
    expect(venueTypeFor(types)).toBe(expected)
  })
})

describe("towns and countries from address parts", () => {
  it.each([
    [parts("KE", ["locality", "Nairobi"], "Nairobi County"), "Nairobi", "KE"],
    [parts("KE", ["locality", "Nyeri"], "Nyeri County"), "Nyeri", "KE"],
    [parts("GB", ["postal_town", "London"], "England"), "London", "GB"],
    [parts("JP", ["locality", "Shibuya"], "Tokyo"), "Shibuya", "JP"],
    [parts("US", ["sublocality_level_1", "Brooklyn"], "NY"), "Brooklyn, NY", "US"],
  ])("reads the town and country", (given, town, country) => {
    expect(cityFromParts(given)).toBe(town)
    expect(countryFromParts(given)).toBe(country)
  })

  it("has no town when Google gives none, and the address stands in for venues made before towns were stored", () => {
    expect(cityFromParts([])).toBeNull()
    expect(townOf({ city: null, address: "214 Bedford Ave, Brooklyn, NY 11249, USA" })).toBe("Brooklyn, NY")
    expect(townOf({ city: "Nyeri", address: "Gakere Rd, Nyeri, Kenya" })).toBe("Nyeri")
  })
})

describe("currencies and time zones", () => {
  it("picks the currency from the country, and dollars when the country is unknown", () => {
    expect(currencyFor("KE")).toBe("KES")
    expect(currencyFor("gb")).toBe("GBP")
    expect(currencyFor("JP")).toBe("JPY")
    expect(currencyFor("ZZ")).toBe("USD")
    expect(currencyFor(null)).toBe("USD")
  })

  it("accepts any real zone and refuses a made-up one", () => {
    expect(isTimeZone("Africa/Nairobi")).toBe(true)
    expect(isTimeZone("Europe/London")).toBe(true)
    expect(isTimeZone("Mars/Olympus")).toBe(false)
    expect(isTimeZone("")).toBe(false)
  })

  it("names a zone the way an owner says it", () => {
    expect(zoneLabel("Africa/Nairobi", new Date("2026-10-14T12:00:00Z"))).toBe("Nairobi (GMT+3)")
  })
})

describe("toPlaceOption", () => {
  it("turns a Places result anywhere into a venue draft with its own zone, town and currency", () => {
    expect(
      toPlaceOption({
        id: "place-1",
        displayName: { text: "Sample Grill" },
        formattedAddress: "Sample Rd, Nyeri, Kenya",
        location: { latitude: -0.42, longitude: 36.95 },
        primaryType: "bar_and_grill",
        addressComponents: parts("KE", ["locality", "Nyeri"], "Nyeri County"),
        timeZone: { id: "Africa/Nairobi" },
      }),
    ).toEqual({
      googlePlaceId: "place-1",
      name: "Sample Grill",
      address: "Sample Rd, Nyeri, Kenya",
      latitude: -0.42,
      longitude: 36.95,
      venueType: "bar",
      timeZone: "Africa/Nairobi",
      countryCode: "KE",
      city: "Nyeri",
      currency: "KES",
    })
  })

  it("falls back to a default zone and dollars when Google gives neither", () => {
    const option = toPlaceOption({
      id: "x",
      displayName: { text: "X" },
      formattedAddress: "Y",
      location: { latitude: 1, longitude: 1 },
      timeZone: { id: "Not/AZone" },
    })
    expect(option).toMatchObject({ timeZone: "America/New_York", currency: "USD", city: null, countryCode: null })
  })

  it("drops a place with no location", () => {
    expect(toPlaceOption({ id: "x", displayName: { text: "X" }, formattedAddress: "Y" })).toBeNull()
  })
})

describe("venueOnboardingSchema", () => {
  const valid = {
    name: "Sample Grill",
    address: "Sample Rd, Nyeri, Kenya",
    googlePlaceId: "place-1",
    latitude: -0.42,
    longitude: 36.95,
    venueType: "bar",
    timeZone: "Africa/Nairobi",
    countryCode: "KE",
    city: "Nyeri",
    currency: "KES",
    slowNight: "tuesday",
    breakEvenHeadcount: 40,
    capacity: 90,
    capabilities: ["stage", "sound_system"],
    hosts: ["poetry", "live_music"],
    atmosphere: "seated",
    talentBudget: 30_000,
    averageSpend: 1_500,
  }

  it("accepts a complete venue outside the US, and one from before towns were stored", () => {
    expect(venueOnboardingSchema.safeParse(valid).success).toBe(true)
    expect(venueOnboardingSchema.safeParse({ ...valid, countryCode: null, city: null }).success).toBe(true)
  })

  it.each([
    ["no quiet night", { slowNight: undefined }],
    ["a break-even of zero", { breakEvenHeadcount: 0 }],
    ["a fractional capacity", { capacity: 90.5 }],
    ["a negative budget", { talentBudget: -1 }],
    ["an unknown capability", { capabilities: ["jacuzzi"] }],
    ["an unknown kind of night", { hosts: ["fireworks"] }],
    ["an unknown atmosphere", { atmosphere: "floating" }],
    ["a made-up zone", { timeZone: "Mars/Olympus" }],
    ["an unknown currency", { currency: "XYZ" }],
    ["a lower-case country", { countryCode: "ke" }],
  ])("refuses %s", (_, change) => {
    expect(venueOnboardingSchema.safeParse({ ...valid, ...change }).success).toBe(false)
  })

  it("stores money in hundredths of the currency", () => {
    expect(toCents(19.995)).toBe(2000)
    expect(toCents(300)).toBe(30000)
  })
})
