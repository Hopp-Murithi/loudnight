import { CircleCheck, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { FadeIn } from "@/components/shared/fade-in"
import { venueHome } from "@/config/navigation"
import { photoForVenue } from "@/config/night-photos"
import { ROUTES } from "@/config/site"
import { VENUE_TYPE_LABELS } from "@/config/venues"
import { townOf } from "@/lib/address"
import type { VenuePlanStatus } from "@/modules/runs/runs.status"
import { VENUE_ROLE_LABELS } from "@/modules/team/team.schemas"
import type { MyVenue } from "../venues.schemas"

function PlanLine({ status }: { status: VenuePlanStatus | undefined }) {
  if (!status || status.status === "none") {
    return <span className="flex items-center gap-1.5 text-muted-foreground">Not planned yet</span>
  }
  if (status.chosen) {
    return (
      <span className="flex min-w-0 items-center gap-1.5 text-success">
        <CircleCheck aria-hidden className="size-4 shrink-0" />
        <span className="truncate">Your night: {status.chosen.name}</span>
      </span>
    )
  }
  if (status.status === "succeeded") {
    return (
      <span className="flex items-center gap-1.5 text-primary">{status.shortlist.length} nights ready to compare</span>
    )
  }
  return (
    <span className="flex items-center gap-2 text-muted-foreground">
      <span aria-hidden className="live-dot size-2 rounded-full bg-success" />
      {status.status === "failed" ? "Plan stopped part way" : "Planning now"}
    </span>
  )
}

function AddVenueCard({ first }: { first: boolean }) {
  return (
    <Link
      href={ROUTES.newVenue}
      className="group flex h-full min-h-64 flex-col items-start justify-end gap-3 border border-dashed p-6 transition-colors outline-none hover:border-primary hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="grid size-10 place-items-center bg-primary text-primary-foreground transition-transform group-hover:scale-105">
        <Plus aria-hidden className="size-5" />
      </span>
      <span className="font-display text-3xl leading-none font-bold">
        {first ? "Add your first venue" : "Add a venue"}
      </span>
      <span className="text-sm text-muted-foreground">
        Find it on the map, pick your quiet night. About two minutes.
      </span>
    </Link>
  )
}

// Each venue as a night out: its photo, its name, and where it stands with planning.
export function VenueList({ venues, statuses }: { venues: MyVenue[]; statuses: Record<string, VenuePlanStatus> }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {venues.map((venue, index) => {
        const photo = photoForVenue(venue.id)
        return (
          <li key={venue.id} className="min-w-0">
            <FadeIn delay={index} className="h-full">
              <Link
                href={venueHome(venue.id, venue.role)}
                className="group flex h-full flex-col overflow-hidden border bg-card transition-shadow outline-none hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="dark relative h-40 overflow-hidden bg-background text-foreground">
                  <Image
                    src={photo.image}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                    placeholder="blur"
                    className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent"
                  />
                  <span className="absolute right-4 bottom-3 left-4 font-display text-3xl leading-none font-bold text-balance">
                    {venue.name}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <p className="text-sm text-muted-foreground">
                    {VENUE_TYPE_LABELS[venue.venueType]} in {townOf(venue) || venue.address}
                  </p>
                  <div className="text-sm">
                    <PlanLine status={statuses[venue.id]} />
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <span>{VENUE_ROLE_LABELS[venue.role]}</span>
                    <span className="text-link group-hover:underline">Open</span>
                  </div>
                </div>
              </Link>
            </FadeIn>
          </li>
        )
      })}
      <li className="min-w-0">
        <FadeIn delay={venues.length} className="h-full">
          <AddVenueCard first={venues.length === 0} />
        </FadeIn>
      </li>
    </ul>
  )
}
