import "server-only"
import { PIPELINE_STEPS } from "@/config/runs"
import type { Weekday } from "@/config/venues"
import { notFound } from "@/lib/http/errors"
import { createAdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"
import { conceptsRepository } from "@/modules/concepts/concepts.repository"
import type { ReceiptView } from "@/modules/concepts/concepts.schemas"
import { describeTool, toToolLine } from "./runs.describe"
import { runsRepository } from "./runs.repository"
import type { RunContext, RunStatus, RunView, StepView } from "./runs.schemas"

const SLICE_ITEMS = 3

function stepStatus(
  step: string,
  run: { status: string; current_step: string | null },
  completed: string[],
): StepView["status"] {
  if (completed.includes(step)) return "done"
  if (run.current_step !== step) return "pending"
  if (run.status === "failed") return "failed"
  return run.status === "running" ? "running" : "pending"
}

// The run as the caller may see it: RLS decides, so judges read demo runs and nobody reads another venue's.
export async function readRun(supabase: ServerSupabase, runId: string): Promise<RunView> {
  const run = await runsRepository.findRun(supabase, runId)
  if (!run || run.mode !== "encore") throw notFound("This plan does not exist, or you cannot see it.")
  const [rows, twin] = await Promise.all([
    runsRepository.listSteps(supabase, runId),
    runsRepository.findGeneric(supabase, runId),
  ])
  const context = (run.context ?? {}) as RunContext
  const completed = context.completed ?? []
  return {
    id: run.id,
    venueId: run.venue_id,
    weekday: run.target_weekday,
    status: run.status as RunStatus,
    errorMessage: run.error_message,
    createdAt: run.created_at,
    steps: PIPELINE_STEPS.map((step) => ({
      step,
      status: stepStatus(step, run, completed),
      tools: rows.filter((row) => row.step === step).map(toToolLine),
      findings: context.findings?.[step] ?? [],
      latencyMs: context.latency?.[step] ?? null,
    })),
    genericRunId: twin?.id ?? null,
    genericAnswer: twin?.generic_answer ?? null,
    scout: context.scout ?? null,
    fingerprint: context.fingerprint ?? null,
    gap: context.gap ?? null,
  }
}

export async function latestRunId(
  supabase: ServerSupabase,
  venueId: string,
  weekday?: Weekday,
): Promise<string | null> {
  return (await runsRepository.latestRun(supabase, venueId, weekday))?.id ?? null
}

const firstList = (response: unknown): unknown[] => {
  const results = (response as { results?: Record<string, unknown> } | null)?.results ?? {}
  const list = Object.values(results).find(Array.isArray)
  return (list as unknown[] | undefined) ?? []
}

// A traced Qloo call's receipt: the question, and the first few results rather than the whole answer.
export async function readStepReceipt(supabase: ServerSupabase, stepId: string): Promise<ReceiptView> {
  const step = await runsRepository.findStep(supabase, stepId)
  if (!step?.qloo_cache_id) throw notFound("That call has no stored answer.")
  const cache = await conceptsRepository.cacheForReceipt(createAdminSupabase(), step.qloo_cache_id)
  const list = firstList(cache.response)
  const request = cache.request as { params?: Record<string, unknown> }
  return {
    claim: describeTool(
      step.tool,
      (step.input ?? {}) as Record<string, unknown>,
      (step.output_summary ?? {}) as Record<string, unknown>,
    ),
    value: null,
    resultCount: list.length,
    endpoint: cache.endpoint,
    params: request.params ?? {},
    fetchedAt: cache.fetched_at,
    slice: list.slice(0, SLICE_ITEMS),
    highlight: [],
  }
}
