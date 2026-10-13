import "server-only"
import { PIPELINE_STEPS, STEP_MAX_SECONDS, type PipelineStep } from "@/config/runs"
import { keepAlive } from "@/lib/http/background"
import { AppError, conflict, forbidden, notFound } from "@/lib/http/errors"
import { createEventStream } from "@/lib/http/stream"
import { createAdminSupabase } from "@/lib/supabase/admin"
import type { RequestContext } from "@/modules/auth/types"
import { venuesService } from "@/modules/venues/venues.service"
import type { VenueDetail } from "@/modules/venues/venues.schemas"
import { runAndStoreStep, storeGenericAnswer } from "./runs.execute"
import type { RunVenue } from "./runs.pipeline"
import { runsRepository } from "./runs.repository"
import type { RunContext, RunEvent } from "./runs.schemas"
import { toToolLine } from "./runs.describe"
import { startMessage } from "./runs.limits"
import type { StepContext } from "./runs.steps"

async function managedVenue(
  ctx: RequestContext,
  venueId: string,
): Promise<VenueDetail & { settings: NonNullable<VenueDetail["settings"]> }> {
  const venue = await venuesService.getDetail(ctx, venueId)
  if (venue.role === "door" || !venue.settings) throw forbidden("Only owners and managers plan nights.")
  return { ...venue, settings: venue.settings }
}

function toRunVenue(venue: Awaited<ReturnType<typeof managedVenue>>): RunVenue {
  return {
    id: venue.id,
    placeId: venue.googlePlaceId,
    point: { latitude: Number(venue.latitude), longitude: Number(venue.longitude) },
    radiusMetres: venue.settings.searchRadiusM,
    timeZone: venue.timeZone,
    weekday: venue.settings.slowNight,
    brief: {
      type: venue.venueType,
      slowNight: venue.settings.slowNight,
      capacity: venue.settings.capacity,
      capabilities: venue.settings.capabilities,
      talentBudgetCents: Math.round(venue.settings.talentBudgetDollars * 100),
      averageSpendCents: Math.round(venue.settings.averageSpendDollars * 100),
    },
  }
}

const plainMessage = (error: unknown) =>
  error instanceof AppError ? error.message : "This step could not finish. Try it again."

async function encoreRun(ctx: RequestContext, runId: string) {
  const run = await runsRepository.findRun(ctx.supabase, runId)
  if (!run || run.mode !== "encore") throw notFound("This plan does not exist, or you cannot see it.")
  return { run, context: (run.context ?? {}) as RunContext }
}

// Replays a finished step from what was stored, with no new calls to anyone.
async function replay(runId: string, step: PipelineStep, context: RunContext, send: (event: RunEvent) => void) {
  const rows = await runsRepository.listSteps(createAdminSupabase(), runId)
  send({ type: "started", step, at: new Date().toISOString() })
  rows.filter((row) => row.step === step).forEach((row) => send({ type: "tool", step, line: toToolLine(row) }))
  ;(context.findings?.[step] ?? []).forEach((text) => send({ type: "finding", step, text }))
  send({ type: "done", step, latencyMs: context.latency?.[step] ?? 0 })
}

// A step whose newest trace row is older than the time limit was cut off by the host, so it may be taken again.
async function isStale(runId: string, step: PipelineStep): Promise<boolean> {
  const rows = (await runsRepository.listSteps(createAdminSupabase(), runId)).filter((row) => row.step === step)
  const newest = rows.at(-1)?.started_at
  return !newest || Date.now() - new Date(newest).getTime() > STEP_MAX_SECONDS * 1000
}

export const runsService = {
  async start(ctx: RequestContext, venueId: string) {
    const venue = await managedVenue(ctx, venueId)
    try {
      return await runsRepository.createPair(ctx.supabase, venueId, ctx.user.id, venue.settings.slowNight)
    } catch (error) {
      throw await startMessage(ctx, error, venue.timeZone)
    }
  },

  async streamStep(ctx: RequestContext, runId: string, step: PipelineStep, signal: AbortSignal) {
    const { run, context } = await encoreRun(ctx, runId)
    const venue = toRunVenue(await managedVenue(ctx, run.venue_id))
    const completed = context.completed ?? []
    const index = PIPELINE_STEPS.indexOf(step)
    if (index > 0 && !completed.includes(PIPELINE_STEPS[index - 1]))
      throw conflict("Finish the step before this one first.")

    const events = createEventStream<RunEvent>(signal)
    const admin = createAdminSupabase()
    if (completed.includes(step)) {
      keepAlive(`replay ${step}`, replay(runId, step, context, events.send).finally(events.close))
      return events.stream
    }
    if (!(await runsRepository.claimStep(admin, runId, step, index === 0))) {
      if (!(await isStale(runId, step))) throw conflict("This step is already running.")
      await runsRepository.updateRun(admin, runId, {
        status: "failed",
        error_message: "The step stopped.",
        finished_at: new Date().toISOString(),
      })
      if (!(await runsRepository.claimStep(admin, runId, step, index === 0)))
        throw conflict("This step is already running.")
    }

    const work = (async () => {
      events.send({ type: "started", step, at: new Date().toISOString() })
      try {
        const trace: StepContext = {
          admin,
          runId,
          venueId: venue.id,
          step,
          emit: (at, line) => events.send({ type: "tool", step: at, line }),
        }
        const { findings, latencyMs } = await runAndStoreStep(trace, venue, context)
        findings.forEach((text) => events.send({ type: "finding", step, text }))
        events.send({ type: "done", step, latencyMs })
      } catch (error) {
        const message = plainMessage(error)
        await runsRepository.updateRun(admin, runId, {
          status: "failed",
          error_message: message,
          finished_at: new Date().toISOString(),
        })
        events.send({ type: "error", step, message, retryable: true })
      } finally {
        events.close()
      }
    })()
    keepAlive(`run ${runId} ${step}`, work)
    return events.stream
  },

  // The plain chatbot answer, made once per plan and stored on the generic twin.
  async generic(ctx: RequestContext, runId: string): Promise<{ answer: string }> {
    const { run } = await encoreRun(ctx, runId)
    const venue = await managedVenue(ctx, run.venue_id)
    const twin = await runsRepository.findGeneric(ctx.supabase, runId)
    if (!twin) throw notFound("This plan has no generic answer to compare.")
    if (twin.generic_answer) return { answer: twin.generic_answer }
    const answer = await storeGenericAnswer(createAdminSupabase(), twin.id, {
      name: venue.name,
      venueType: venue.venueType,
      address: venue.address,
      weekday: venue.settings.slowNight,
    })
    return { answer }
  },
}
