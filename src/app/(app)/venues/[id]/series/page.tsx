import { CalendarDays } from "lucide-react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { ROUTES } from "@/config/site"
import { WEEKDAY_LABELS } from "@/config/venues"
import { getPageContext } from "@/modules/auth/server/context"
import { listShortlist } from "@/modules/concepts/concepts.read"
import { nextEvenings } from "@/modules/gap/gap.weekdays"
import { planStatuses } from "@/modules/runs/runs.status"
import { SeriesWeeks } from "@/modules/series/components/series-weeks"
import { StageEmpty } from "@/modules/series/components/stage-empty"
import { venueForPage } from "@/modules/venues/venues.page"

export const metadata: Metadata = { title: "Series" }

export default async function VenueSeriesPage({ params }: PageProps<"/venues/[id]/series">) {
  const ctx = await getPageContext()
  const { id } = await params
  const venue = await venueForPage(ctx, id)
  const status = (await planStatuses(ctx.supabase, [id]))[id]
  const weekday = venue.settings?.slowNight ?? "tuesday"
  const night = WEEKDAY_LABELS[weekday]
  const chosen =
    status.chosen && status.runId
      ? (await listShortlist(ctx.supabase, status.runId)).find((concept) => concept.chosen)
      : undefined

  return (
    <>
      <PageHeader title="Series" description={`One good ${night} becomes four, with a twist each week.`} />
      {chosen ? (
        <SeriesWeeks
          venueId={id}
          concept={chosen}
          nights={nextEvenings(weekday, venue.timeZone, new Date()).map((evening) => evening.localDate)}
        />
      ) : (
        <StageEmpty
          icon={CalendarDays}
          title={status.shortlist.length > 0 ? "Choose your night first" : `Plan your ${night} first`}
          description={
            status.shortlist.length > 0
              ? "Three nights are waiting. Pick one and it becomes a four-week series here."
              : "Encore finds the night your neighbourhood is waiting for. Once you choose one, its four weeks appear here."
          }
          action={
            venue.role === "door"
              ? undefined
              : {
                  label: status.shortlist.length > 0 ? "Compare the nights" : `Plan my ${night}`,
                  href: status.runId ? ROUTES.venueRun(id, status.runId) : ROUTES.venuePlan(id),
                }
          }
        />
      )}
    </>
  )
}
