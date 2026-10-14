"use client"

import { Banknote, DoorOpen, Ticket, Users } from "lucide-react"
import { KpiCard } from "@/components/shared/kpi-card"
import { formatMoney } from "@/lib/format"
import type { DoorView } from "../door.schemas"
import { useDoor } from "../hooks/use-door"

// Tonight, live: the same feed as the door, so the owner's laptop moves the moment someone is let in.
export function LiveTonight({ initial }: { initial: DoorView }) {
  const door = useDoor(initial)
  const { numbers, breakEven, money } = door
  const target = breakEven ?? 0
  return (
    <section aria-labelledby="live-heading" className="space-y-3">
      <h2 id="live-heading" className="flex items-center gap-2 text-sm font-medium">
        <span aria-hidden className="live-dot size-2 rounded-full bg-success" />
        Live: {door.night.title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="In tonight"
          value={numbers.arrived}
          hint={target ? `${numbers.toBreakEven} more to break even` : undefined}
          icon={DoorOpen}
          tone={target && numbers.toBreakEven === 0 ? "success" : "info"}
          meter={target ? Math.min(100, (numbers.arrived / target) * 100) : undefined}
        />
        <KpiCard label="Places saved" value={numbers.rsvps} hint={`${numbers.rsvpPeople} people`} icon={Ticket} />
        <KpiCard
          label="RSVPs here"
          value={numbers.showUpRate === null ? "None yet" : `${Math.round(numbers.showUpRate * 100)}%`}
          hint={`${numbers.walkIns} walk-ins`}
          icon={Users}
        />
        {money && (
          <KpiCard
            label={money.takingsLogged ? "Takings" : "Takings, estimated"}
            value={formatMoney(money.takingsCents, money.currency)}
            hint={money.takingsLogged ? "as you logged them" : "people in times your average spend"}
            icon={Banknote}
          />
        )}
      </div>
    </section>
  )
}
