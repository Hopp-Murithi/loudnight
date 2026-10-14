import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { placePickSchema, type PlacePickInput } from "@/modules/venues/venues.schemas"
import { pickVenuePlace } from "@/modules/venues/venues.search"

// The details of the place an owner picked from the search. Same session rules as the search itself.
export const POST = apiRoute<PlacePickInput>(
  { body: placePickSchema, rateLimit: RATE_LIMITS.placesSearch },
  async ({ body }) => pickVenuePlace(body.placeId, body.session),
)
