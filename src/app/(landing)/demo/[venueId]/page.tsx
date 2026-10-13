import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { EmptyState } from "@/components/shared/empty-state"
import { WEEKDAY_LABELS } from "@/config/venues"
import { AppError } from "@/lib/http/errors"
import { createServerSupabase } from "@/lib/supabase/server"
import { DemoHeader } from "@/modules/demo/components/demo-header"
import { DemoWorkspace } from "@/modules/demo/components/demo-workspace"
import { TourStrip } from "@/modules/demo/components/tour-strip"
import { TryYourOwn } from "@/modules/demo/components/try-your-own"
import { readDemoPlan } from "@/modules/demo/demo.service"
import type { DemoPlan } from "@/modules/demo/demo.schemas"

async function planForPage(venueId: string): Promise<DemoPlan> {
  try {
    return await readDemoPlan(await createServerSupabase(), venueId)
  } catch (error) {
    if (error instanceof AppError && error.code === "not_found") notFound()
    throw error
  }
}

export async function generateMetadata({ params }: PageProps<"/demo/[venueId]">): Promise<Metadata> {
  const { venue } = await planForPage((await params).venueId)
  const night = WEEKDAY_LABELS[venue.slowNight]
  return {
    title: `${venue.name}: a ${night} plan`,
    description: `Three ${night} nights for ${venue.name}, each backed by what its neighbourhood loves.`,
  }
}

export default async function DemoPage({ params }: PageProps<"/demo/[venueId]">) {
  const { venue, run, concepts } = await planForPage((await params).venueId)
  const plannedAt = run
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: venue.timeZone }).format(
        new Date(run.createdAt),
      )
    : null

  return (
    <>
      <DemoHeader venue={venue} plannedAt={plannedAt} />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 [&>*]:min-w-0">
        {run && plannedAt ? (
          <>
            <TourStrip />
            <DemoWorkspace run={run} concepts={concepts} radiusMetres={venue.radiusMetres} plannedAt={plannedAt} />
          </>
        ) : (
          <EmptyState
            title="This plan is still being prepared"
            description="Encore has not finished planning this venue yet. You can run a plan for your own venue now."
          />
        )}
        <TryYourOwn night={WEEKDAY_LABELS[venue.slowNight]} />
      </div>
    </>
  )
}
