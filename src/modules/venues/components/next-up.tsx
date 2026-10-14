import { CircleCheck } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/site"
import type { Weekday } from "@/config/venues"
import type { VenuePlanStatus } from "@/modules/runs/runs.status"
import { StartRunButton } from "@/modules/runs/components/start-run"

interface NextUpProps {
  venueId: string
  weekday: Weekday | undefined
  night: string
  status: VenuePlanStatus
  canPlan: boolean
}

function Frame({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section
      aria-labelledby="next-up"
      className="dark poster-glow relative flex h-full flex-col gap-5 overflow-hidden p-6 text-foreground sm:p-8"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-spotlight" />
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{kicker}</p>
        <h2 id="next-up" className="font-display text-4xl leading-none font-bold text-balance">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

// The one thing to do next, whatever stage the venue is at. Every state ends in a single clear action.
export function NextUp({ venueId, weekday, night, status, canPlan }: NextUpProps) {
  const plan = status.runId ? ROUTES.venueRun(venueId, status.runId) : ROUTES.venuePlan(venueId, weekday)

  if (!canPlan || !weekday) {
    return (
      <Frame kicker="Next up" title="Doors open on event nights">
        <p className="text-muted-foreground">When a night is published, you check guests in from the Door page.</p>
        <Button
          className="mt-auto self-start"
          size="lg"
          nativeButton={false}
          render={<Link href={ROUTES.venueDoor(venueId)} />}
        >
          Open the door
        </Button>
      </Frame>
    )
  }

  if (status.status === "none") {
    return (
      <Frame kicker="Next up" title={`Find the ${night} nobody nearby is running`}>
        <p className="max-w-xl text-muted-foreground">
          Encore reads what your neighbourhood loves, checks what is already on, and brings back three nights with the
          evidence behind them. About a minute.
        </p>
        <div className="mt-auto">
          <StartRunButton venueId={venueId} weekday={weekday} label={`Plan my ${night}`} />
        </div>
      </Frame>
    )
  }

  if (status.status === "running" || status.status === "queued" || status.status === "failed") {
    const failed = status.status === "failed"
    return (
      <Frame kicker="Next up" title={failed ? "Your plan stopped part way" : "Your plan is being made"}>
        <p className="flex items-center gap-2 text-muted-foreground">
          {!failed && <span aria-hidden className="live-dot size-2 rounded-full bg-success" />}
          {failed
            ? "Pick up where it stopped. Finished steps are kept."
            : "You can watch it, or come back in a minute."}
        </p>
        <Button className="mt-auto self-start" size="lg" nativeButton={false} render={<Link href={plan} />}>
          {failed ? "Carry on with the plan" : "Watch it plan"}
        </Button>
      </Frame>
    )
  }

  if (status.chosen) {
    return (
      <Frame kicker={`Your ${night}`} title={status.chosen.name}>
        <p className="flex items-center gap-2 text-sm text-success">
          <CircleCheck aria-hidden className="size-4" />
          Chosen, scoring {status.chosen.total} out of 100
        </p>
        <p className="text-muted-foreground">Next, turn it into four weeks with a twist each week.</p>
        <Button
          className="mt-auto self-start"
          size="lg"
          nativeButton={false}
          render={<Link href={ROUTES.venueSeries(venueId, weekday)} />}
        >
          See the series
        </Button>
      </Frame>
    )
  }

  return (
    <Frame kicker="Next up" title={`${status.shortlist.length} nights are ready. Pick one.`}>
      <ol className="divide-y border-y">
        {status.shortlist.map((night, index) => (
          <li key={night.id} className="flex items-center gap-4 py-3">
            <span className="w-5 font-display text-2xl leading-none font-bold text-muted-foreground">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate font-medium">{night.name}</span>
            <span className="text-sm text-muted-foreground tabular-nums">{night.total}</span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground">
        Each one combines tastes your neighbours share, avoids what is already on nearby, and opens every number to the
        Qloo answer behind it.
      </p>
      <Button className="mt-auto self-start" size="lg" nativeButton={false} render={<Link href={plan} />}>
        Compare the nights
      </Button>
    </Frame>
  )
}
