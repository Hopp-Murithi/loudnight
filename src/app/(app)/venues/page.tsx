import { Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/site"
import { getPageContext } from "@/modules/auth/server/context"
import { VenueList } from "@/modules/venues/components/venue-list"
import { venuesService } from "@/modules/venues/venues.service"

export const metadata: Metadata = { title: "Your venues" }

export default async function VenuesPage() {
  const ctx = await getPageContext()
  const venues = await venuesService.listMine(ctx)

  return (
    <>
      <PageHeader
        title="Your venues"
        description="Pick a venue to plan its quiet night, or add another."
        actions={
          venues.length > 0 && (
            <Button nativeButton={false} render={<Link href={ROUTES.newVenue} />}>
              <Plus className="size-4" aria-hidden />
              Add a venue
            </Button>
          )
        }
      />
      <VenueList venues={venues} />
    </>
  )
}
