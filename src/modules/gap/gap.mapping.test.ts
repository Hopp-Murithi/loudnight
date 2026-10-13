import { describe, expect, it } from "vitest"
import { tidyHours, toNearbyEvents, toNearbyVenues, toScout } from "./gap.mapping"

const venue = { latitude: 40.7174, longitude: -73.9575 }
const EN_DASH = String.fromCharCode(8211)

describe("tidyHours", () => {
  it("turns Google's dash and narrow spaces into plain words", () => {
    expect(tidyHours(`Tuesday: 4:00 PM ${EN_DASH} 2:00 AM`)).toBe("Tuesday: 4:00 PM to 2:00 AM")
  })
})

describe("toScout", () => {
  it("keeps what the owner did not enter: type, rating and tidy hours", () => {
    const scout = toScout({
      id: "p",
      displayName: { text: "Sample Bar" },
      primaryTypeDisplayName: { text: "Bar" },
      rating: 4.3,
      userRatingCount: 120,
      regularOpeningHours: { weekdayDescriptions: [`Monday: 4:00 PM ${EN_DASH} 2:00 AM`] },
    })
    expect(scout).toMatchObject({ name: "Sample Bar", type: "Bar", rating: 4.3, ratingCount: 120 })
    expect(scout.hours).toEqual(["Monday: 4:00 PM to 2:00 AM"])
  })
})

describe("toNearbyVenues", () => {
  const places = [
    {
      id: "far",
      displayName: { text: "Far" },
      primaryType: "wine_bar",
      location: { latitude: 40.73, longitude: -73.9575 },
    },
    { id: "self", displayName: { text: "Us" }, location: venue },
    {
      id: "near",
      displayName: { text: "Near" },
      primaryTypeDisplayName: { text: "Pub" },
      location: { latitude: 40.718, longitude: -73.9575 },
    },
  ]

  it("leaves the venue itself out and puts the closest first", () => {
    const result = toNearbyVenues(places, "self", venue)
    expect(result.map((place) => place.name)).toEqual(["Near", "Far"])
    expect(result[0].type).toBe("Pub")
    expect(result[1].type).toBe("Wine bar")
  })
})

describe("toNearbyEvents", () => {
  const nights = ["2026-10-13", "2026-10-20"]

  it("drops events that started before the nights searched, such as a season pass", () => {
    const pass = { id: "pass", name: "Sample Exhibition Pass", dates: { start: { localDate: "2026-09-12" } } }
    expect(toNearbyEvents([pass], nights)).toEqual([])
  })

  it("collapses timed entries of the same show into one row", () => {
    const slot = (id: string) => ({ id, name: "Sample Exhibition", dates: { start: { localDate: "2026-10-13" } } })
    expect(toNearbyEvents([slot("a"), slot("b"), slot("c")], nights)).toHaveLength(1)
  })

  it("lists an event once even when two nights both return it", () => {
    const event = { id: "e1", name: "Sample Trivia", dates: { start: { localDate: "2026-10-20" } } }
    const other = {
      id: "e2",
      name: "Sample Jazz",
      dates: { start: { localDate: "2026-10-13" } },
      _embedded: { venues: [{ name: "Hall" }] },
    }
    const result = toNearbyEvents([event, other, event], nights)
    expect(result.map((item) => item.id)).toEqual(["e2", "e1"])
    expect(result[0].venue).toBe("Hall")
  })
})
