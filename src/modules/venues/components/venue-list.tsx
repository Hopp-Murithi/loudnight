import { Plus, Store } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { venueHome } from "@/config/navigation"
import { ROUTES } from "@/config/site"
import { VENUE_TYPE_LABELS } from "@/config/venues"
import { VENUE_ROLE_LABELS } from "@/modules/team/team.schemas"
import type { MyVenue } from "../venues.schemas"

export function VenueList({ venues }: { venues: MyVenue[] }) {
  if (venues.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 border border-dashed p-8">
        <Store className="size-6 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <p className="font-medium">Add your first venue</p>
          <p className="max-w-md text-sm text-muted-foreground">
            It takes about two minutes: find it on the map, pick your quiet night, and say what the room can host.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href={ROUTES.newVenue} />}>
          <Plus className="size-4" aria-hidden />
          Add a venue
        </Button>
      </div>
    )
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {venues.map((venue) => (
        <li key={venue.id} className="min-w-0">
          <Link
            href={venueHome(venue.id, venue.role)}
            className="flex h-full flex-col gap-2 border bg-card p-5 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="text-lg font-semibold">{venue.name}</span>
            <span className="text-sm text-muted-foreground">{venue.address}</span>
            <span className="mt-auto pt-2 text-xs text-muted-foreground">
              {VENUE_TYPE_LABELS[venue.venueType]}, you are {VENUE_ROLE_LABELS[venue.role].toLowerCase()}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
