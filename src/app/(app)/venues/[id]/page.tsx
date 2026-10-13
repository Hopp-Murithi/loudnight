import { CalendarDays, DoorOpen, Users, Wallet } from "lucide-react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { SectionCard } from "@/components/shared/section-card"
import { VENUE_CAPABILITY_LABELS, VENUE_TYPE_LABELS, WEEKDAY_LABELS } from "@/config/venues"
import { formatMoney } from "@/lib/format"
import { getPageContext } from "@/modules/auth/server/context"
import { toCents } from "@/modules/venues/venues.schemas"
import { venueForPage } from "@/modules/venues/venues.page"

export const metadata: Metadata = { title: "Overview" }

export default async function VenueOverviewPage({ params }: PageProps<"/venues/[id]">) {
  const venue = await venueForPage(await getPageContext(), (await params).id)
  const settings = venue.settings

  return (
    <>
      <PageHeader title={venue.name} description={`${VENUE_TYPE_LABELS[venue.venueType]} at ${venue.address}`} />
      {settings ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Quiet night"
              value={WEEKDAY_LABELS[settings.slowNight]}
              icon={CalendarDays}
              hint="The night Encore plans for"
            />
            <KpiCard
              label="Break-even"
              value={settings.breakEvenHeadcount}
              icon={Users}
              hint="Guests the night needs"
            />
            <KpiCard label="Room" value={settings.capacity} icon={DoorOpen} hint="People it holds" />
            <KpiCard
              label="Guest spend"
              value={formatMoney(toCents(settings.averageSpendDollars))}
              icon={Wallet}
              hint={`${formatMoney(toCents(settings.talentBudgetDollars))} talent budget`}
            />
          </div>
          <SectionCard title="What the space can host" description="Concepts are chosen to fit these.">
            <p className="text-sm">
              {settings.capabilities.length > 0
                ? settings.capabilities.map((item) => VENUE_CAPABILITY_LABELS[item]).join(", ")
                : "Nothing listed yet. Add a stage, screen or kitchen in Settings."}
            </p>
          </SectionCard>
        </>
      ) : (
        <SectionCard title="Your role here" description="Door staff check guests in on event nights.">
          <p className="text-sm text-muted-foreground">Plans and money are visible to the owner and managers.</p>
        </SectionCard>
      )}
      <SectionCard title="Planning" description="Encore reads your neighbourhood and suggests three nights.">
        <p className="text-sm text-muted-foreground">Planning opens here once the neighbourhood reader is connected.</p>
      </SectionCard>
    </>
  )
}
