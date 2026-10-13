import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { getPageContext } from "@/modules/auth/server/context"
import { TeamPanel } from "@/modules/team/components/team-panel"
import { teamService } from "@/modules/team/team.service"
import { venueForPage } from "@/modules/venues/venues.page"

export const metadata: Metadata = { title: "Team" }

export default async function VenueTeamPage({ params }: PageProps<"/venues/[id]/team">) {
  const ctx = await getPageContext()
  const venue = await venueForPage(ctx, (await params).id)
  if (venue.role === "door") notFound()
  const members = await teamService.list(ctx, venue.id)

  return (
    <>
      <PageHeader
        title="Team"
        description={
          venue.role === "owner" ? "Invite the people who run your nights." : "The people who run this venue."
        }
      />
      <TeamPanel venueId={venue.id} members={members} canEdit={venue.role === "owner"} />
    </>
  )
}
