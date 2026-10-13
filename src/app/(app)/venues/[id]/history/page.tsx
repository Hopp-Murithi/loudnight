import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { getPageContext } from "@/modules/auth/server/context"
import { HistoryTimeline } from "@/modules/history/components/history-timeline"
import { venueHistory } from "@/modules/history/history.service"
import { venueForPage } from "@/modules/venues/venues.page"

export const metadata: Metadata = { title: "History" }

export default async function VenueHistoryPage({ params }: PageProps<"/venues/[id]/history">) {
  const ctx = await getPageContext()
  const venue = await venueForPage(ctx, (await params).id)
  // Door staff never read the history; RLS returns nothing for them, and the page does not exist.
  if (venue.role === "door") notFound()
  const entries = await venueHistory(ctx.supabase, venue.id, 100)

  return (
    <>
      <PageHeader title="History" description={`Every change to ${venue.name}: who made it and when.`} />
      <HistoryTimeline entries={entries} timeZone={venue.timeZone} />
    </>
  )
}
