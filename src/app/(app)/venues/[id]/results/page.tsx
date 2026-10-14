import { ChartColumn } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { ROUTES } from "@/config/site"
import { formatMoney } from "@/lib/format"
import { getPageContext } from "@/modules/auth/server/context"
import { StageEmpty } from "@/modules/series/components/stage-empty"
import { toCents } from "@/modules/venues/venues.schemas"
import { venueForPage } from "@/modules/venues/venues.page"

export const metadata: Metadata = { title: "Results" }

export default async function VenueResultsPage({ params }: PageProps<"/venues/[id]/results">) {
  const ctx = await getPageContext()
  const venue = await venueForPage(ctx, (await params).id)
  // Results carry money, so they are for owners and managers only.
  if (!venue.settings) notFound()
  const { breakEvenHeadcount, averageSpend } = venue.settings
  const measures = [
    { label: "Guests", value: "0", hint: `of ${breakEvenHeadcount} to break even` },
    {
      label: "Extra takings",
      value: formatMoney(0, venue.currency),
      hint: `at ${formatMoney(toCents(averageSpend), venue.currency)} a guest`,
    },
    { label: "Next week", value: "Night 1", hint: "after it: keep, tweak or swap, by turnout" },
  ]

  return (
    <>
      <PageHeader title="Results" description="Who came, against break-even, night by night." />
      <StageEmpty
        icon={ChartColumn}
        title="Results start after your first night"
        description="Check-ins at the door become turnout, takings and a clear call for next week. Nothing to guess, nothing to type in."
        action={{ label: "See the series", href: ROUTES.venueSeries(venue.id) }}
      >
        <dl className="grid gap-px border bg-border sm:grid-cols-3" aria-label="What each night will show">
          {measures.map((item) => (
            <div key={item.label} className="bg-card p-5">
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
              <dd className="font-display text-4xl leading-tight font-bold text-muted-foreground/60 tabular-nums">
                {item.value}
              </dd>
              <dd className="text-xs text-muted-foreground">{item.hint}</dd>
            </div>
          ))}
        </dl>
      </StageEmpty>
    </>
  )
}
