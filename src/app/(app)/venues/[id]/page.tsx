import type { Metadata } from "next"
import { FadeIn } from "@/components/shared/fade-in"
import { WEEKDAY_LABELS } from "@/config/venues"
import { getPageContext } from "@/modules/auth/server/context"
import { venueHistory } from "@/modules/history/history.service"
import { planStatuses } from "@/modules/runs/runs.status"
import { NextUp } from "@/modules/venues/components/next-up"
import { RecentActivity, VenueNumbers, VenueRoom } from "@/modules/venues/components/venue-facts"
import { venueForPage } from "@/modules/venues/venues.page"

export const metadata: Metadata = { title: "Home" }

export default async function VenueOverviewPage({ params }: PageProps<"/venues/[id]">) {
  const ctx = await getPageContext()
  const { id } = await params
  const venue = await venueForPage(ctx, id)
  const settings = venue.settings
  const [statuses, history] = await Promise.all([
    planStatuses(ctx.supabase, [id]),
    settings ? venueHistory(ctx.supabase, id, 5) : Promise.resolve([]),
  ])
  const night = WEEKDAY_LABELS[settings?.slowNight ?? "tuesday"]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <FadeIn className="lg:row-span-2">
        <NextUp venueId={id} night={night} status={statuses[id]} canPlan={settings !== null} />
      </FadeIn>
      {settings && (
        <>
          <FadeIn delay={1}>
            <VenueNumbers settings={settings} />
          </FadeIn>
          <FadeIn delay={2}>
            <VenueRoom venueId={id} capabilities={settings.capabilities} />
          </FadeIn>
          <FadeIn delay={3} className="lg:col-span-2">
            <RecentActivity venueId={id} entries={history} />
          </FadeIn>
        </>
      )}
    </div>
  )
}
