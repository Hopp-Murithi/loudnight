import "server-only"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { PipelineStep } from "@/config/runs"
import type { Json } from "@/types/database"
import { toToolLine } from "./runs.describe"
import { runsRepository } from "./runs.repository"
import type { ToolLine } from "./runs.schemas"

export type { PipelineStep }

export interface StepContext {
  admin: AdminSupabase
  runId: string
  venueId: string
  step: PipelineStep
  // Streams each finished tool call to the viewer as a trace line.
  emit?: (step: PipelineStep, line: ToolLine) => void
}

export interface StepOutcome {
  ok: boolean
  summary: Json
  cacheId?: string | null
}

export type FinishStep = (outcome: StepOutcome) => Promise<void>

// One row per tool call, so the live trace and the "Powered by Qloo" panel show what ran and how long it took.
export async function recordStep(context: StepContext, tool: string, input: Json): Promise<FinishStep> {
  const started = Date.now()
  const id = await runsRepository.insertStep(context.admin, {
    run_id: context.runId,
    venue_id: context.venueId,
    step: context.step,
    tool,
    input,
  })
  return async ({ ok, summary, cacheId = null }) => {
    const latency = Date.now() - started
    const status = ok ? "succeeded" : "failed"
    await runsRepository.finishStep(context.admin, id, {
      status,
      output_summary: summary,
      qloo_cache_id: cacheId,
      latency_ms: latency,
      finished_at: new Date().toISOString(),
    })
    context.emit?.(
      context.step,
      toToolLine({ id, tool, status, input, output_summary: summary, qloo_cache_id: cacheId, latency_ms: latency }),
    )
  }
}

// Runs one tool call inside a trace row. Without a run (scripts, demo upkeep) it just runs the call.
export async function withStep<T>(
  trace: StepContext | undefined,
  tool: string,
  input: Json,
  call: () => Promise<T>,
  summarise: (result: T) => Omit<StepOutcome, "ok">,
): Promise<T> {
  const finish = trace ? await recordStep(trace, tool, input) : null
  try {
    const result = await call()
    await finish?.({ ok: true, ...summarise(result) })
    return result
  } catch (error) {
    await finish?.({ ok: false, summary: input })
    throw error
  }
}

export const atStep = (trace: StepContext | undefined, step: PipelineStep): StepContext | undefined =>
  trace ? { ...trace, step } : undefined
