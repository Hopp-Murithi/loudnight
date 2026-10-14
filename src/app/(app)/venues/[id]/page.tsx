import type { Metadata } from "next"
import { FadeIn } from "@/components/shared/fade-in"
import { NightSwitcher } from "@/modules/venues/components/night-switcher"
import { getPageContext } from "@/modules/auth/server/context"
import { venueHistory } from "@/modules/history/history.service"
import { ReadinessCard } from "@/modules/readiness/components/readiness-card"
import { readReadiness } from "@/modules/readiness/readiness.service"
import { planStatuses } from "@/modules/runs/runs.status"
import { NextUp } from "@/modules/venues/components/next-up"
import { RecentActivity, VenueNumbers, VenueRoom } from "@/modules/venues/components/venue-facts"
import { nightForPage, venueForPage } from "@/modules/venues/venues.page"

export const metadata: Metadata = { title: "Home" }

export default async function VenueOverviewPage({ params, searchParams }: PageProps<"/venues/[id]">) {
  const ctx = await getPageContext()
  const [{ id }, { night: requested }] = await Promise.all([params, searchParams])
  const venue = await venueForPage(ctx, id)
  const settings = venue.settings
  const { weekday, nights, label: night } = nightForPage(venue, requested)
  const [statuses, history] = await Promise.all([
    planStatuses(ctx.supabase, [id], weekday),
    settings ? venueHistory(ctx.supabase, id, 5) : Promise.resolve([]),
  ])
  const chosen = statuses[id].chosen
  const readiness = chosen && settings ? await readReadiness(ctx.supabase, { ...venue, settings }, chosen.id) : null

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {weekday && nights.length > 1 && (
        <div className="lg:col-span-2">
          <NightSwitcher venueId={id} nights={nights} current={weekday} page="venue" />
        </div>
      )}
      <FadeIn className="lg:row-span-2">
        <NextUp venueId={id} weekday={weekday} night={night} status={statuses[id]} canPlan={settings !== null} />
      </FadeIn>
      {settings && (
        <>
          <FadeIn delay={1}>
            <VenueNumbers settings={settings} currency={venue.currency} />
          </FadeIn>
          <FadeIn delay={2}>
            <VenueRoom venueId={id} capabilities={settings.capabilities} />
          </FadeIn>
          {readiness && (
            <FadeIn delay={3} className="lg:col-span-2">
              <ReadinessCard readiness={readiness} canEdit={venue.role !== "door"} />
            </FadeIn>
          )}
          <FadeIn delay={3} className="lg:col-span-2">
            <RecentActivity venueId={id} entries={history} timeZone={venue.timeZone} />
          </FadeIn>
        </>
      )}
    </div>
  )
}
