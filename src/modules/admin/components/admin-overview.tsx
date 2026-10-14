import { Ban, CalendarCheck, DoorOpen, Sparkles, Store, Ticket, TriangleAlert, Users } from "lucide-react"
import { KpiCard } from "@/components/shared/kpi-card"
import { plural } from "@/lib/format"
import type { AdminOverview } from "../admin.schemas"

// The platform at a glance, today counted from midnight UTC.
export function AdminOverviewCards({ overview }: { overview: AdminOverview }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Venues" value={overview.venues} icon={Store} hint={`${overview.suspendedVenues} suspended`} />
      <KpiCard label="People" value={overview.people} icon={Users} hint={`${overview.peopleWithEmail} with an email`} />
      <KpiCard label="Plans today" value={overview.plansToday} icon={Sparkles} hint="Fresh plans started" />
      <KpiCard
        label="Plans that stopped"
        value={overview.failedPlansToday}
        icon={TriangleAlert}
        tone={overview.failedPlansToday > 0 ? "warning" : "neutral"}
        hint={overview.failedPlansToday > 0 ? "Owners can carry on from where it stopped" : "None today"}
      />
      <KpiCard label="Nights published" value={overview.publishedNights} icon={CalendarCheck} hint="Live event pages" />
      <KpiCard label="RSVPs today" value={overview.rsvpsToday} icon={Ticket} hint="Places saved by guests" />
      <KpiCard label="Check-ins today" value={overview.checkinsToday} icon={DoorOpen} hint="Arrivals at the door" />
      <KpiCard
        label="Suspended"
        value={overview.suspendedVenues}
        icon={Ban}
        tone={overview.suspendedVenues > 0 ? "danger" : "neutral"}
        hint={plural(overview.suspendedVenues, "venue")}
      />
    </div>
  )
}
