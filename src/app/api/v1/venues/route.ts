import { apiRoute } from "@/lib/http/route"
import { venueOnboardingSchema, type VenueOnboardingInput } from "@/modules/venues/venues.schemas"
import { venuesService } from "@/modules/venues/venues.service"

export const GET = apiRoute({}, async ({ ctx }) => venuesService.listMine(ctx))

export const POST = apiRoute<VenueOnboardingInput>({ body: venueOnboardingSchema }, async ({ ctx, body }) =>
  venuesService.create(ctx, body),
)
