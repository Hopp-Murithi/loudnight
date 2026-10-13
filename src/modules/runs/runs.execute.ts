import "server-only"
import { PIPELINE_STEPS } from "@/config/runs"
import { anthropic } from "@/lib/ai/client"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { Json } from "@/types/database"
import { genericRequest, tidyGenericAnswer } from "./runs.generic"
import { executeStep, type RunVenue } from "./runs.pipeline"
import { runsRepository } from "./runs.repository"
import type { RunContext } from "./runs.schemas"
import type { StepContext } from "./runs.steps"

export interface StoredStep {
  context: RunContext
  findings: string[]
  latencyMs: number
}

// Runs one step and stores what it hands on. Live runs and demo upkeep both go through here, so they cannot drift.
export async function runAndStoreStep(trace: StepContext, venue: RunVenue, context: RunContext): Promise<StoredStep> {
  const started = Date.now()
  const { patch, findings } = await executeStep(trace.step, venue, context, trace)
  const latencyMs = Date.now() - started
  const next: RunContext = {
    ...context,
    ...patch,
    findings: { ...context.findings, [trace.step]: findings },
    latency: { ...context.latency, [trace.step]: latencyMs },
    completed: [...(context.completed ?? []), trace.step],
  }
  const last = PIPELINE_STEPS.indexOf(trace.step) === PIPELINE_STEPS.length - 1
  await runsRepository.updateRun(trace.admin, trace.runId, {
    context: next as unknown as Json,
    status: last ? "succeeded" : "running",
    finished_at: last ? new Date().toISOString() : null,
  })
  return { context: next, findings, latencyMs }
}

// What a plain chatbot says about the venue, stored once on the generic twin of a plan.
export async function storeGenericAnswer(
  admin: AdminSupabase,
  twinId: string,
  facts: Parameters<typeof genericRequest>[0],
): Promise<string> {
  const message = await anthropic().messages.create(genericRequest(facts))
  const text = message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("\n")
  const answer = tidyGenericAnswer(text)
  const now = new Date().toISOString()
  await runsRepository.updateRun(admin, twinId, {
    generic_answer: answer,
    status: "succeeded",
    started_at: now,
    finished_at: now,
  })
  return answer
}
