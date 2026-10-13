import "server-only"
import { forbidden } from "@/lib/http/errors"
import type { RequestContext } from "@/modules/auth/types"
import type { VenueDetail } from "./venues.schemas"
import { venuesService } from "./venues.service"

export type ManagedVenue = VenueDetail & { settings: NonNullable<VenueDetail["settings"]> }

// For anything that plans or spends: owners and managers only. RLS decides who may read the venue at all.
export async function managedVenue(ctx: RequestContext, venueId: string): Promise<ManagedVenue> {
  const venue = await venuesService.getDetail(ctx, venueId)
  if (venue.role === "door" || !venue.settings) throw forbidden("Only owners and managers plan nights.")
  return { ...venue, settings: venue.settings }
}
