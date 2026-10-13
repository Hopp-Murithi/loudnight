import { apiRoute } from "@/lib/http/route"
import { venueSettingsSchema, type VenueSettingsInput } from "@/modules/venues/venues.schemas"
import { venuesService } from "@/modules/venues/venues.service"

export const PATCH = apiRoute<VenueSettingsInput, { id: string }>(
  { body: venueSettingsSchema },
  async ({ ctx, params, body }) => {
    await venuesService.updateSettings(ctx, params.id, body)
    return { saved: true }
  },
)
