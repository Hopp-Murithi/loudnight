import "server-only"
import { notFound } from "next/navigation"
import { WEEKDAY_LABELS, type Weekday } from "@/config/venues"
import { AppError } from "@/lib/http/errors"
import type { RequestContext } from "@/modules/auth/types"
import { nightOf } from "./venues.nights"
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

export interface PageNight {
  // Undefined for door staff, who cannot see settings: their pages follow the latest plan of any night.
  weekday: Weekday | undefined
  nights: Weekday[]
  label: string
}

export function nightForPage(venue: VenueDetail, requested: string | string[] | undefined): PageNight {
  const nights = venue.settings?.quietNights ?? []
  const weekday = nightOf(nights, requested)
  return { weekday, nights, label: weekday ? WEEKDAY_LABELS[weekday] : "quiet night" }
}
