import { CalendarDays } from "lucide-react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { ROUTES } from "@/config/site"
import { WEEKDAY_LABELS } from "@/config/venues"
import { getPageContext } from "@/modules/auth/server/context"
import { listShortlist } from "@/modules/concepts/concepts.read"
import { planStatuses } from "@/modules/runs/runs.status"
import { NightStrip } from "@/modules/series/components/night-strip"
import { SeriesPoster } from "@/modules/series/components/series-poster"
import { StageEmpty } from "@/modules/series/components/stage-empty"
import { readSeries } from "@/modules/series/series.service"
import { TalentShortlist } from "@/modules/talent/components/talent-shortlist"
import { readTalent } from "@/modules/talent/talent.read"
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

  const [series, acts] = chosen
    ? await Promise.all([readSeries(ctx.supabase, chosen.id, venue.timeZone), readTalent(ctx.supabase, chosen.id)])
    : [null, { talent: [], references: [] }]
  const canEdit = venue.role !== "door"

  return (
    <>
      <PageHeader title="Series" description={`One good ${night} becomes four, with a twist each week.`} />
      {chosen ? (
        <>
          <SeriesPoster venueId={id} concept={chosen} night={night} hasSeries={series !== null} canEdit={canEdit} />
          {series && <NightStrip nights={series.nights} timeZone={venue.timeZone} canEdit={canEdit} />}
          {series && (
            <TalentShortlist
              seriesId={series.id}
              nightName={chosen.name}
              talent={acts.talent}
              references={acts.references}
              canEdit={canEdit}
            />
          )}
        </>
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
