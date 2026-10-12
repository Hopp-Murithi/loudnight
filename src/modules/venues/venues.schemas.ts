import type { VenueType } from "@/config/venues"

export interface DemoVenue {
  id: string
  name: string
  address: string
  venueType: VenueType
  planReady: boolean
}
