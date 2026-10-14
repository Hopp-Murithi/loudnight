import { ChartColumn } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { ROUTES } from "@/config/site"
import { getPageContext } from "@/modules/auth/server/context"
import { GainCalculator } from "@/modules/door/components/gain-calculator"
import { LiveTonight } from "@/modules/door/components/live-tonight"
import { NightResults } from "@/modules/door/components/night-results"
import { readResults } from "@/modules/door/door.results"
import { readDoor } from "@/modules/door/door.service"
import { StageEmpty } from "@/modules/series/components/stage-empty"
import { venueForPage } from "@/modules/venues/venues.page"

export const metadata: Metadata = { title: "Results" }

// Who came, against break-even, night by night, with tonight live. Money, so owners and managers only.
export default async function VenueResultsPage({ params }: PageProps<"/venues/[id]/results">) {
  const ctx = await getPageContext()
  const venue = await venueForPage(ctx, (await params).id)
  if (!venue.settings) notFound()
  const [results, tonight] = await Promise.all([readResults(ctx, venue.id), readDoor(ctx, venue.id)])
  const best = Math.max(0, ...results.nights.map((night) => night.numbers.arrived))

  return (
    <>
      <PageHeader title="Results" description="Who came, against break-even, night by night. Tonight updates live." />
      {tonight && <LiveTonight initial={tonight} />}
      {results.nights.length > 0 ? (
        <NightResults nights={results.nights} currency={results.currency} timeZone={venue.timeZone} />
      ) : (
        <StageEmpty
          icon={ChartColumn}
          title="Results start with your first published night"
          description="Check-ins at the door become turnout and takings here, night by night. Nothing to guess."
          action={{ label: "See the series", href: ROUTES.venueSeries(venue.id) }}
        />
      )}
      <GainCalculator
        currency={results.currency}
        averageSpendCents={results.averageSpendCents}
        extraGuests={best || Math.round(results.breakEven / 2) || 30}
      />
    </>
  )
}
