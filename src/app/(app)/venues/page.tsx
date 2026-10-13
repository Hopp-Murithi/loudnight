import type { Metadata } from "next"
import { TYPE } from "@/lib/typography"
import { getPageContext } from "@/modules/auth/server/context"
import { planStatuses } from "@/modules/runs/runs.status"
import { VenueList } from "@/modules/venues/components/venue-list"
import { venuesService } from "@/modules/venues/venues.service"

export const metadata: Metadata = { title: "Your venues" }

export default async function VenuesPage() {
  const ctx = await getPageContext()
  const venues = await venuesService.listMine(ctx)
  const statuses = await planStatuses(
    ctx.supabase,
    venues.map((venue) => venue.id),
  )
  const first = ctx.user.displayName?.split(" ")[0]

  return (
    <>
      <div className="space-y-3">
        <span aria-hidden className="block h-1.5 w-12 bg-spotlight" />
        <h1 className={TYPE.display}>{first ? `Good to see you, ${first}.` : "Your venues"}</h1>
        <p className={TYPE.lead}>
          {venues.length === 0
            ? "Add your venue and Encore finds the night your neighbourhood is waiting for."
            : "Pick a venue to plan its quiet night, or add another."}
        </p>
      </div>
      <VenueList venues={venues} statuses={statuses} />
    </>
  )
}
