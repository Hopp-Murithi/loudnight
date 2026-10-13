import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { placeSearchSchema, type PlaceSearchInput } from "@/modules/venues/venues.schemas"
import { searchVenuePlaces } from "@/modules/venues/venues.search"

export const POST = apiRoute<PlaceSearchInput>(
  { body: placeSearchSchema, rateLimit: RATE_LIMITS.placesSearch },
  async ({ body }) => searchVenuePlaces(body.query),
)
