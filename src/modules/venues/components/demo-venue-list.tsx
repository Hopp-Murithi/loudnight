import { CircleCheck, Clock } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { SectionCard } from "@/components/shared/section-card"
import { ToneBadge } from "@/components/shared/tone-badge"
import { VENUE_TYPE_LABELS } from "@/config/venues"
import type { DemoVenue } from "../venues.schemas"

export function DemoVenueList({ venues }: { venues: DemoVenue[] }) {
  if (venues.length === 0) {
    return <EmptyState title="No demo venues yet" description="Demo venues appear here once they are loaded." />
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {venues.map((venue) => (
        <li key={venue.id} className="min-w-0">
          <SectionCard
            title={venue.name}
            description={VENUE_TYPE_LABELS[venue.venueType]}
            action={
              venue.planReady ? (
                <ToneBadge tone="success" icon={CircleCheck} label="Plan ready" />
              ) : (
                <ToneBadge tone="neutral" icon={Clock} label="Plan being prepared" />
              )
            }
          >
            <p className="text-sm">{venue.address}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {venue.planReady
                ? "Open the plan to see the concepts and the evidence behind them."
                : "The planner has not finished this venue yet."}
            </p>
          </SectionCard>
        </li>
      ))}
    </ul>
  )
}
