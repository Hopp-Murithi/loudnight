import "server-only"
import { notFound } from "next/navigation"
import { AppError } from "@/lib/http/errors"
import type { RequestContext } from "@/modules/auth/types"
import { venuesService } from "./venues.service"
import type { VenueDetail } from "./venues.schemas"

// For pages: a venue the person cannot see renders the not-found page, exactly like one that does not exist.
export async function venueForPage(ctx: RequestContext, venueId: string): Promise<VenueDetail> {
  try {
    return await venuesService.getDetail(ctx, venueId)
  } catch (error) {
    if (error instanceof AppError && error.code === "not_found") notFound()
    throw error
  }
}
