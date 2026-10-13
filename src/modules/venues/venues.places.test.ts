import { describe, expect, it } from "vitest"
import { timeZoneForAddress } from "@/config/time-zones"
import { toPlaceOption, venueTypeFor } from "./venues.places"
import { toCents, venueOnboardingSchema } from "./venues.schemas"

describe("venueTypeFor", () => {
  it.each([
    [["night_club", "bar"], "music_venue"],
    [["cocktail_bar", "establishment"], "bar"],
    [["coffee_shop"], "cafe"],
    [["italian_restaurant", "food"], "restaurant"],
    [["gym"], "other"],
  ])("maps %j to %s", (types, expected) => {
    expect(venueTypeFor(types)).toBe(expected)
  })
})

describe("timeZoneForAddress", () => {
  it.each([
    ["214 Bedford Ave, Brooklyn, NY 11249, USA", "America/New_York"],
    ["1100 E 6th St, Austin, TX 78702, USA", "America/Chicago"],
    ["100 Main St, Phoenix, AZ 85004", "America/Phoenix"],
    ["1 Market St, San Francisco, CA 94105-1234, USA", "America/Los_Angeles"],
  ])("reads the state from %s", (address, zone) => {
    expect(timeZoneForAddress(address)).toBe(zone)
  })

  it("falls back to Eastern when there is no US state", () => {
    expect(timeZoneForAddress("10 Downing St, London SW1A 2AA, UK")).toBe("America/New_York")
  })
})

describe("toPlaceOption", () => {
  it("turns a Places result into a venue draft", () => {
    expect(
      toPlaceOption({
        id: "place-1",
        displayName: { text: "The Copper Room" },
        formattedAddress: "214 Bedford Ave, Brooklyn, NY 11249, USA",
        location: { latitude: 40.7174, longitude: -73.9575 },
        primaryType: "bar",
      }),
    ).toEqual({
      googlePlaceId: "place-1",
      name: "The Copper Room",
      address: "214 Bedford Ave, Brooklyn, NY 11249, USA",
      latitude: 40.7174,
      longitude: -73.9575,
      venueType: "bar",
      timeZone: "America/New_York",
    })
  })

  it("drops a place with no location", () => {
    expect(toPlaceOption({ id: "x", displayName: { text: "X" }, formattedAddress: "Y" })).toBeNull()
  })
})

describe("venueOnboardingSchema", () => {
  const valid = {
    name: "The Copper Room",
    address: "214 Bedford Ave, Brooklyn, NY 11249, USA",
    googlePlaceId: "place-1",
    latitude: 40.7174,
    longitude: -73.9575,
    venueType: "bar",
    timeZone: "America/New_York",
    slowNight: "tuesday",
    breakEvenHeadcount: 40,
    capacity: 90,
    capabilities: ["stage", "sound_system"],
    talentBudgetDollars: 300,
    averageSpendDollars: 20,
  }

  it("accepts a complete venue", () => {
    expect(venueOnboardingSchema.safeParse(valid).success).toBe(true)
  })

  it.each([
    ["no quiet night", { slowNight: undefined }],
    ["a break-even of zero", { breakEvenHeadcount: 0 }],
    ["a fractional capacity", { capacity: 90.5 }],
    ["a negative budget", { talentBudgetDollars: -1 }],
    ["an unknown capability", { capabilities: ["jacuzzi"] }],
    ["a zone outside the list", { timeZone: "Europe/London" }],
  ])("refuses %s", (_, change) => {
    expect(venueOnboardingSchema.safeParse({ ...valid, ...change }).success).toBe(false)
  })

  it("stores money in whole cents", () => {
    expect(toCents(19.995)).toBe(2000)
    expect(toCents(300)).toBe(30000)
  })
})
