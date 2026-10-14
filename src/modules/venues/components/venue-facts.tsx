import { Check, History as HistoryIcon } from "lucide-react"
import Link from "next/link"
import { SectionCard } from "@/components/shared/section-card"
import { ROUTES } from "@/config/site"
import { VENUE_CAPABILITIES, VENUE_CAPABILITY_LABELS } from "@/config/venues"
import { formatMoney } from "@/lib/format"
import type { HistoryEntry } from "@/modules/history/history.service"
import { toCents, type VenueSettingsView } from "../venues.schemas"

// The four numbers a plan is built on, in one place, each with what it means.
export function VenueNumbers({ settings, currency }: { settings: VenueSettingsView; currency: string }) {
  const rows = [
    { label: "Break-even", value: String(settings.breakEvenHeadcount), hint: "guests a night needs" },
    { label: "Room", value: String(settings.capacity), hint: "people it holds" },
    { label: "Guest spend", value: formatMoney(toCents(settings.averageSpend), currency), hint: "on an average night" },
    { label: "Talent budget", value: formatMoney(toCents(settings.talentBudget), currency), hint: "per night" },
  ]
  return (
    <SectionCard title="Your numbers" description="What every plan is sized to.">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="font-display text-3xl leading-tight font-bold tabular-nums">{row.value}</dd>
            <dd className="text-xs text-muted-foreground">{row.hint}</dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  )
}

export function VenueRoom({ venueId, capabilities }: { venueId: string; capabilities: string[] }) {
  return (
    <SectionCard title="The room" description="Nights are chosen to fit what it can host.">
      <ul className="flex flex-wrap gap-2">
        {VENUE_CAPABILITIES.map((capability) => {
          const has = capabilities.includes(capability)
          return (
            <li
              key={capability}
              className={
                has
                  ? "inline-flex items-center gap-1.5 border border-primary/40 bg-primary/10 px-2.5 py-1 text-sm"
                  : "border border-dashed px-2.5 py-1 text-sm text-muted-foreground"
              }
            >
              {has && <Check aria-hidden className="size-3.5 text-primary" />}
              {VENUE_CAPABILITY_LABELS[capability]}
              <span className="sr-only">{has ? ", available" : ", not available"}</span>
            </li>
          )
        })}
      </ul>
      <Link
        href={ROUTES.venueSettings(venueId)}
        className="mt-4 inline-block text-sm text-link underline-offset-4 hover:underline"
      >
        Change in settings
      </Link>
    </SectionCard>
  )
}

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
    new Date(iso),
  )

export function RecentActivity({ venueId, entries }: { venueId: string; entries: HistoryEntry[] }) {
  return (
    <SectionCard title="Recent activity" description="Who changed what, newest first.">
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing yet. Changes to the venue and its nights appear here.</p>
      ) : (
        <ol className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="flex gap-3 text-sm">
              <HistoryIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p>
                  <span className="font-medium">{entry.who}</span> {entry.what}
                </p>
                <p className="text-xs text-muted-foreground">{when(entry.at)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      <Link
        href={ROUTES.venueHistory(venueId)}
        className="mt-4 inline-block text-sm text-link underline-offset-4 hover:underline"
      >
        See the full history
      </Link>
    </SectionCard>
  )
}
