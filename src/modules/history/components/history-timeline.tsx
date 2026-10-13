import { History } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { initials } from "@/lib/text"
import type { HistoryEntry } from "../history.service"

const day = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone }).format(new Date(iso))
const time = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(iso))
// Every change to the venue, grouped by day in the venue's own time zone.
export function HistoryTimeline({ entries, timeZone }: { entries: HistoryEntry[]; timeZone: string }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="Nothing has changed yet"
        description="Changes to the venue, its team and its nights appear here."
      />
    )
  }
  const days = entries.reduce<{ label: string; items: HistoryEntry[] }[]>((groups, entry) => {
    const label = day(entry.at, timeZone)
    const last = groups.at(-1)
    if (last?.label === label) last.items.push(entry)
    else groups.push({ label, items: [entry] })
    return groups
  }, [])

  return (
    <div className="space-y-8">
      {days.map((group) => (
        <section key={group.label} aria-label={group.label} className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <History aria-hidden className="size-4" />
            {group.label}
          </h2>
          <ol className="divide-y border bg-card">
            {group.items.map((entry) => (
              <li key={entry.id} className="flex items-start gap-4 p-4">
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-semibold text-primary"
                >
                  {initials(entry.who)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{entry.who}</span> {entry.what}
                  </p>
                  {entry.changed.length > 0 && (
                    <p className="text-xs text-muted-foreground">Changed: {entry.changed.join(", ")}</p>
                  )}
                </div>
                <time dateTime={entry.at} className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {time(entry.at, timeZone)}
                </time>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
