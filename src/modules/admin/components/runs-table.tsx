import { CircleCheck, Clock, LoaderCircle, TriangleAlert } from "lucide-react"
import Link from "next/link"
import type { Tone } from "@/components/shared/tone"
import { ToneBadge } from "@/components/shared/tone-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PIPELINE } from "@/config/runs"
import { ROUTES } from "@/config/site"
import { WEEKDAY_LABELS, type Weekday } from "@/config/venues"
import type { AdminRun } from "../admin.schemas"

const STATUS: Record<AdminRun["status"], { label: string; tone: Tone; icon: typeof Clock }> = {
  queued: { label: "Waiting", tone: "neutral", icon: Clock },
  running: { label: "Planning", tone: "info", icon: LoaderCircle },
  succeeded: { label: "Ready", tone: "success", icon: CircleCheck },
  failed: { label: "Stopped", tone: "danger", icon: TriangleAlert },
}

const started = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso))
const stepLabel = (step: string | null) => PIPELINE.find((entry) => entry.step === step)?.label ?? "Not started"

function RunStatus({ run }: { run: AdminRun }) {
  const status = STATUS[run.status]
  return <ToneBadge tone={status.tone} icon={status.icon} label={status.label} />
}

// Every plan, newest first: whose it is, for which night, how far it got and why it stopped. Each opens the plan.
export function RunsTable({ runs }: { runs: AdminRun[] }) {
  return (
    <>
      <div className="hidden border bg-card md:block">
        <Table>
          <TableHeader className="bg-muted/70">
            <TableRow>
              <TableHead>Venue and night</TableHead>
              <TableHead>Started (UTC)</TableHead>
              <TableHead>Step</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow
                key={run.id}
                data-failed={run.status === "failed"}
                className="hover:bg-primary/5 data-[failed=true]:bg-destructive/5"
              >
                <TableCell>
                  <Link
                    href={ROUTES.venueRun(run.venueId, run.id)}
                    className="font-medium text-link underline-offset-4 hover:underline"
                  >
                    {run.venueName}
                  </Link>
                  <span className="block text-xs text-muted-foreground">{WEEKDAY_LABELS[run.weekday as Weekday]}</span>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{started(run.startedAt)}</TableCell>
                <TableCell className="max-w-72 text-sm">
                  {stepLabel(run.step)}
                  {run.error && <span className="block text-xs text-destructive">{run.error}</span>}
                </TableCell>
                <TableCell>
                  <RunStatus run={run} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="grid gap-2 md:hidden">
        {runs.map((run) => (
          <li key={run.id}>
            <Link
              href={ROUTES.venueRun(run.venueId, run.id)}
              className="block space-y-1 border bg-card p-3 outline-none hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="block font-medium">
                {run.venueName}, {WEEKDAY_LABELS[run.weekday as Weekday]}
              </span>
              <span className="block text-xs text-muted-foreground">
                {started(run.startedAt)} UTC. {stepLabel(run.step)}
              </span>
              {run.error && <span className="block text-xs text-destructive">{run.error}</span>}
              <span className="block pt-1">
                <RunStatus run={run} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
