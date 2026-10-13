import "server-only"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { Database, Json } from "@/types/database"
import { runsRepository } from "./runs.repository"

export type PipelineStep = Database["public"]["Enums"]["pipeline_step"]

export interface StepContext {
  admin: AdminSupabase
  runId: string
  venueId: string
  step: PipelineStep
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
  return async ({ ok, summary, cacheId = null }) =>
    runsRepository.finishStep(context.admin, id, {
      status: ok ? "succeeded" : "failed",
      output_summary: summary,
      qloo_cache_id: cacheId,
      latency_ms: Date.now() - started,
      finished_at: new Date().toISOString(),
    })
}
