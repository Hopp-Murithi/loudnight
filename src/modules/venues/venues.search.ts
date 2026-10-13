import "server-only"
import { searchPlaces } from "@/lib/places/client"
import { toPlaceOption } from "./venues.places"
import type { PlaceOption } from "./venues.schemas"

// Address search for onboarding. The Places key stays on the server; only the fields Encore needs come back.
export async function searchVenuePlaces(query: string): Promise<PlaceOption[]> {
  const places = await searchPlaces(query)
  return places.map(toPlaceOption).filter((place): place is PlaceOption => place !== null)
}
