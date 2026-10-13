import { distanceMetres, type LatLng } from "@/lib/geo"
import type { Place, PlaceDetails } from "@/lib/places/client"
import type { TicketmasterEvent } from "@/lib/ticketmaster/client"
import type { NearbyEvent, NearbyVenue, Scout } from "./gap.schemas"

const NARROW_SPACES = new RegExp(`[${String.fromCharCode(0x202f, 0xa0)}]`, "g")
const LONG_DASHES = new RegExp(String.raw`\s*[${String.fromCharCode(0x2013, 0x2014)}]\s*`, "g")

// Google writes hours with a long dash and narrow spaces. Encore copy never uses long dashes.
export const tidyHours = (line: string) =>
  line.replace(NARROW_SPACES, " ").replace(LONG_DASHES, " to ").replace(/\s+/g, " ").trim()

const titleCase = (type: string) => type.replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase())

export function toScout(details: PlaceDetails): Scout {
  return {
    name: details.displayName?.text ?? "Your venue",
    type: details.primaryTypeDisplayName?.text ?? (details.primaryType ? titleCase(details.primaryType) : null),
    rating: details.rating ?? null,
    ratingCount: details.userRatingCount ?? null,
    hours: (details.regularOpeningHours?.weekdayDescriptions ?? []).map(tidyHours),
    website: details.websiteUri ?? null,
  }
}

// Nearby competition, closest first, without the venue itself.
export function toNearbyVenues(places: Place[], venuePlaceId: string | null, venue: LatLng): NearbyVenue[] {
  return places
    .filter((place) => place.id !== venuePlaceId)
    .map((place) => ({
      placeId: place.id,
      name: place.displayName?.text ?? "Unnamed place",
      type: place.primaryTypeDisplayName?.text ?? (place.primaryType ? titleCase(place.primaryType) : "Venue"),
      rating: place.rating ?? null,
      distanceMetres: place.location ? distanceMetres(venue, place.location) : null,
    }))
    .sort((a, b) => (a.distanceMetres ?? Infinity) - (b.distanceMetres ?? Infinity))
}

// Events that start on one of the target nights, one row per name: timed entries and multi-night runs collapse.
export function toNearbyEvents(events: TicketmasterEvent[], nights: readonly string[]): NearbyEvent[] {
  const onNights = new Set(nights)
  const seen = new Set<string>()
  return events
    .filter((event) => onNights.has(event.dates?.start.localDate ?? ""))
    .filter((event) => {
      const key = event.name.trim().toLowerCase()
      return seen.has(key) ? false : (seen.add(key), true)
    })
    .map((event) => ({
      id: event.id,
      name: event.name,
      localDate: event.dates?.start.localDate ?? "",
      venue: event._embedded?.venues?.[0]?.name ?? null,
      genre: event.classifications?.[0]?.genre?.name ?? event.classifications?.[0]?.segment?.name ?? null,
    }))
    .sort((a, b) => a.localDate.localeCompare(b.localDate))
}
