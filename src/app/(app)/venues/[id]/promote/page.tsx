import { Megaphone } from "lucide-react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { ROUTES } from "@/config/site"
import { NightSwitcher } from "@/modules/venues/components/night-switcher"
import { getPageContext } from "@/modules/auth/server/context"
import { AdStudio } from "@/modules/promote/components/ad-studio"
import { readPromoBoard } from "@/modules/promote/promote.service"
import { planStatuses } from "@/modules/runs/runs.status"
import { StageEmpty } from "@/modules/series/components/stage-empty"
import { nightForPage, venueForPage } from "@/modules/venues/venues.page"

export const metadata: Metadata = { title: "Promote" }

export default async function VenuePromotePage({ params, searchParams }: PageProps<"/venues/[id]/promote">) {
  const ctx = await getPageContext()
  const [{ id }, { night: requested }] = await Promise.all([params, searchParams])
  const venue = await venueForPage(ctx, id)
  const { weekday, nights, label: night } = nightForPage(venue, requested)
  const status = (await planStatuses(ctx.supabase, [id], weekday))[id]
  const board = status.chosen ? await readPromoBoard(ctx.supabase, venue, status.chosen.id) : null

  return (
    <>
      <PageHeader title="Promote" description="Posters, banners and short videos for each night, ready to post." />
      {weekday && <NightSwitcher venueId={id} nights={nights} current={weekday} page="venuePromote" />}
      {board ? (
        <AdStudio board={board} canEdit={venue.role !== "door"} />
      ) : (
        <StageEmpty
          icon={Megaphone}
          title={status.chosen ? "Make it four weeks first" : `Choose your ${night} first`}
          description="Ads are made from a night's real name, date and act. Once your series exists, every night gets its own poster and video here."
          action={
            status.chosen
              ? { label: "Open the series", href: ROUTES.venueSeries(id, weekday) }
              : { label: "Open the plan", href: ROUTES.venuePlan(id, weekday) }
          }
        />
      )}
    </>
  )
}
