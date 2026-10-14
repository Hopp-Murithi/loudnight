import "server-only"
import { VENUE_PLACE_TYPES } from "@/config/countries"
import { notFound } from "@/lib/http/errors"
import { autocompletePlaces, placeForVenue, type PlaceSuggestions as GoogleSuggestions } from "@/lib/places/client"
import { toPlaceOption } from "./venues.places"
import type { PlaceOption, PlaceSearchInput, PlaceSuggestions } from "./venues.schemas"

// Google's place types read as words: "night_club" is "Night club".
const kindOf = (types: string[] | undefined) => {
  const type = types?.find((entry) => entry !== "point_of_interest" && entry !== "establishment" && entry !== "food")
  return type ? type.charAt(0).toUpperCase() + type.slice(1).replaceAll("_", " ") : null
}

function toSuggestions(answer: GoogleSuggestions) {
  return answer.suggestions.flatMap(({ placePrediction: place }) =>
    place
      ? [
          {
            placeId: place.placeId,
            name: place.structuredFormat?.mainText.text ?? place.text?.text ?? "",
            detail: place.structuredFormat?.secondaryText?.text ?? "",
            kind: kindOf(place.types),
          },
        ]
      : [],
  )
}

// Places in the chosen country, venues first. When no bar, club, restaurant, cafe or pub matches, every kind of
// place in the country is offered instead, and the list says so.
export async function searchVenuePlaces(input: PlaceSearchInput): Promise<PlaceSuggestions> {
  const ask = { text: input.query, country: input.country, session: input.session }
  const venues = toSuggestions(await autocompletePlaces({ ...ask, types: VENUE_PLACE_TYPES }))
  if (venues.length > 0) return { places: venues, broadened: false }
  return { places: toSuggestions(await autocompletePlaces(ask)), broadened: true }
}

// The picked place, with its location, town, country, time zone and currency filled in.
export async function pickVenuePlace(placeId: string, session: string): Promise<PlaceOption> {
  const option = toPlaceOption(await placeForVenue(placeId, session))
  if (!option) throw notFound("Google has no address for that place. Pick another, or search for its street.")
  return option
}
