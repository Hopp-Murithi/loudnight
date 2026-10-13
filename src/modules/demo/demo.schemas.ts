import type { Weekday, VenueType } from "@/config/venues"
import type { ConceptView } from "@/modules/concepts/concepts.schemas"
import type { RunView } from "@/modules/runs/runs.schemas"

export interface DemoVenueView {
  id: string
  name: string
  address: string
  venueType: VenueType
  timeZone: string
  slowNight: Weekday
  breakEvenHeadcount: number
  capacity: number
  radiusMetres: number
}

export interface DemoPlan {
  venue: DemoVenueView
  run: RunView | null
  concepts: ConceptView[]
}

export interface PrecomputeSummary {
  venueId: string
  name: string
  runId: string
  concepts: number
  seconds: number
}
