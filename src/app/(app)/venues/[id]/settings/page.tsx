import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { getPageContext } from "@/modules/auth/server/context"
import { DeleteVenueForm, VenueIdentityForm, VenueSettingsForm } from "@/modules/venues/components/settings-forms"
import { venueForPage } from "@/modules/venues/venues.page"

export const metadata: Metadata = { title: "Settings" }

export default async function VenueSettingsPage({ params }: PageProps<"/venues/[id]/settings">) {
  const venue = await venueForPage(await getPageContext(), (await params).id)
  // Door staff never see settings or money; RLS returns none, and the page does not exist for them.
  if (!venue.settings) notFound()

  return (
    <>
      <PageHeader title="Settings" description={`What Encore knows about ${venue.name}.`} />
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Venue details" description="Name, address and time zone.">
          <VenueIdentityForm venue={venue} />
        </SectionCard>
        <SectionCard title="Your nights" description="The quiet night, the room and the money.">
          <VenueSettingsForm venueId={venue.id} settings={venue.settings} />
        </SectionCard>
        {venue.role === "owner" && (
          <SectionCard title="Delete this venue" description="This cannot be undone." className="border-destructive/40">
            <DeleteVenueForm venue={venue} />
          </SectionCard>
        )}
      </div>
    </>
  )
}
