import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { ROUTES } from "@/config/site"
import { WEEKDAY_LABELS } from "@/config/venues"
import { getPageContext } from "@/modules/auth/server/context"
import { PlanIntro } from "@/modules/runs/components/plan-intro"
import { latestRunId } from "@/modules/runs/runs.read"
import { venueForPage } from "@/modules/venues/venues.page"

export const metadata: Metadata = { title: "Plan" }

export default async function PlanPage({ params }: PageProps<"/venues/[id]/plan">) {
  const ctx = await getPageContext()
  const { id } = await params
  const venue = await venueForPage(ctx, id)
  const latest = await latestRunId(ctx.supabase, id)
  if (latest) redirect(ROUTES.venueRun(id, latest))
  const night = WEEKDAY_LABELS[venue.settings?.slowNight ?? "tuesday"]

  return (
    <>
      <PageHeader title="Plan" description={`New nights for ${venue.name}, built from what its neighbourhood loves.`} />
      <PlanIntro venueId={id} night={night} canRun={venue.role !== "door" && venue.settings !== null} />
    </>
  )
}
