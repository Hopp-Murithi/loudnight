import { apiRoute } from "@/lib/http/route"
import {
  deleteVenueSchema,
  venueIdentitySchema,
  type DeleteVenueInput,
  type VenueIdentityInput,
} from "@/modules/venues/venues.schemas"
import { venuesService } from "@/modules/venues/venues.service"

type Params = { id: string }

export const GET = apiRoute<undefined, Params>({}, async ({ ctx, params }) => venuesService.getDetail(ctx, params.id))

export const PATCH = apiRoute<VenueIdentityInput, Params>(
  { body: venueIdentitySchema },
  async ({ ctx, params, body }) => {
    await venuesService.updateIdentity(ctx, params.id, body)
    return { saved: true }
  },
)

export const DELETE = apiRoute<DeleteVenueInput, Params>({ body: deleteVenueSchema }, async ({ ctx, params, body }) => {
  await venuesService.remove(ctx, params.id, body.confirmName)
  return { deleted: true }
})
