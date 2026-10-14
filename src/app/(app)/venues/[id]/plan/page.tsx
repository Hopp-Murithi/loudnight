import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { ROUTES } from "@/config/site"
import { getPageContext } from "@/modules/auth/server/context"
import { PlanIntro } from "@/modules/runs/components/plan-intro"
import { latestRunId } from "@/modules/runs/runs.read"
import { NightSwitcher } from "@/modules/venues/components/night-switcher"
import { nightForPage, venueForPage } from "@/modules/venues/venues.page"

export const metadata: Metadata = { title: "Plan" }

export default async function PlanPage({ params, searchParams }: PageProps<"/venues/[id]/plan">) {
  const ctx = await getPageContext()
  const [{ id }, { night: requested }] = await Promise.all([params, searchParams])
  const venue = await venueForPage(ctx, id)
  const night = nightForPage(venue, requested)
  const latest = await latestRunId(ctx.supabase, id, night.weekday)
  if (latest) redirect(ROUTES.venueRun(id, latest))

  return (
    <>
      <PageHeader title="Plan" description={`New nights for ${venue.name}, built from what its neighbourhood loves.`} />
      {night.weekday && <NightSwitcher venueId={id} nights={night.nights} current={night.weekday} page="venuePlan" />}
      <PlanIntro
        venueId={id}
        weekday={night.weekday}
        night={night.label}
        canRun={venue.role !== "door" && venue.settings !== null}
      />
    </>
  )
}
