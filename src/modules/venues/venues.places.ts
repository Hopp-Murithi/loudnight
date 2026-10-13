import { timeZoneForAddress } from "@/config/time-zones"
import type { VenueType } from "@/config/venues"
import type { PlaceOption } from "./venues.schemas"

interface PlaceLike {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  location?: { latitude: number; longitude: number }
  types?: string[]
  primaryType?: string
}

// Google's place types, most specific first, mapped to the venue types Encore plans for.
const TYPE_RULES: [VenueType, (type: string) => boolean][] = [
  ["music_venue", (type) => ["night_club", "live_music_venue", "concert_hall", "event_venue"].includes(type)],
  ["bar", (type) => type === "bar" || type === "pub" || type.endsWith("_bar") || type === "brewery"],
  ["cafe", (type) => type === "cafe" || type === "coffee_shop" || type === "tea_house" || type === "bakery"],
  ["restaurant", (type) => type === "restaurant" || type.endsWith("_restaurant")],
]

export function venueTypeFor(types: string[]): VenueType {
  for (const type of types) {
    const match = TYPE_RULES.find(([, test]) => test(type))
    if (match) return match[0]
  }
  return "other"
}

// A place without a name, address or location is no use for planning, so it is dropped.
export function toPlaceOption(place: PlaceLike): PlaceOption | null {
  if (!place.displayName?.text || !place.formattedAddress || !place.location) return null
  const types = [place.primaryType, ...(place.types ?? [])].filter((type): type is string => Boolean(type))
  return {
    googlePlaceId: place.id,
    name: place.displayName.text,
    address: place.formattedAddress,
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    venueType: venueTypeFor(types),
    timeZone: timeZoneForAddress(place.formattedAddress),
  }
}
