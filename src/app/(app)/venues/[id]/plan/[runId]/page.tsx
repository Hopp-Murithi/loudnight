import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { WEEKDAY_LABELS, type Weekday } from "@/config/venues"
import { AppError } from "@/lib/http/errors"
import { getPageContext } from "@/modules/auth/server/context"
import { listShortlist } from "@/modules/concepts/concepts.read"
import { RunWorkspace } from "@/modules/runs/components/run-workspace"
import { StartRunButton } from "@/modules/runs/components/start-run"
import { readRun } from "@/modules/runs/runs.read"
import type { RunView } from "@/modules/runs/runs.schemas"
import { venueForPage } from "@/modules/venues/venues.page"

export const metadata: Metadata = { title: "Plan" }

async function runForPage(...args: Parameters<typeof readRun>): Promise<RunView> {
  try {
    return await readRun(...args)
  } catch (error) {
    if (error instanceof AppError && error.code === "not_found") notFound()
    throw error
  }
}

export default async function RunPage({ params }: PageProps<"/venues/[id]/plan/[runId]">) {
  const ctx = await getPageContext()
  const { id, runId } = await params
  const venue = await venueForPage(ctx, id)
  const run = await runForPage(ctx.supabase, runId)
  if (run.venueId !== id) notFound()
  const scored = run.steps.some((step) => step.step === "score" && step.status === "done")
  const concepts = scored ? await listShortlist(ctx.supabase, runId) : []
  const canRun = venue.role !== "door" && venue.settings !== null
  const night = WEEKDAY_LABELS[run.weekday as Weekday]
  const planned = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: venue.timeZone }).format(
    new Date(run.createdAt),
  )

  return (
    <>
      <PageHeader
        title={`Your ${night} plan`}
        description={`Planned ${planned}. Every number opens the Qloo answer it came from.`}
        actions={
          canRun && run.status === "succeeded" ? (
            <StartRunButton venueId={id} label="Plan again" variant="outline" />
          ) : undefined
        }
      />
      <RunWorkspace
        initial={run}
        initialConcepts={concepts}
        canRun={canRun}
        radiusMetres={venue.settings?.searchRadiusM ?? 2000}
      />
    </>
  )
}
