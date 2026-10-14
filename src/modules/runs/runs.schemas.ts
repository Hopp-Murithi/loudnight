import { z } from "zod"
import { PIPELINE_STEPS, type PipelineStep, type ToolSource } from "@/config/runs"
import { WEEKDAYS, type Weekday } from "@/config/venues"
import type { Candidate } from "@/modules/concepts/concepts.schemas"
import type { OverlapResult } from "@/modules/concepts/concepts.signals"
import type { PlanningSummary } from "@/modules/concepts/concepts.service"
import type { GapScan, Scout } from "@/modules/gap/gap.schemas"
import type { TasteFingerprint } from "@/modules/taste/taste.schemas"

export const startRunSchema = z.object({ weekday: z.enum(WEEKDAYS) })
export type StartRunInput = z.infer<typeof startRunSchema>

export const stepParamSchema = z.enum(PIPELINE_STEPS as [PipelineStep, ...PipelineStep[]])

export interface ToolLine {
  id: string
  tool: string
  source: ToolSource
  label: string
  ok: boolean
  latencyMs: number | null
  fromCache: boolean
  hasReceipt: boolean
}

// One line of the NDJSON stream for a step.
export type RunEvent =
  | { type: "started"; step: PipelineStep; at: string }
  | { type: "tool"; step: PipelineStep; line: ToolLine }
  | { type: "finding"; step: PipelineStep; text: string }
  | { type: "done"; step: PipelineStep; latencyMs: number }
  | { type: "error"; step: PipelineStep; message: string; retryable: boolean }

// What each step hands to the next, stored on the run because every step is its own server call.
export interface RunContext {
  scout?: Scout | null
  fingerprint?: TasteFingerprint
  gap?: GapScan
  invention?: { candidates: Candidate[]; overlaps: OverlapResult[]; turns: number; toolCalls: number }
  summary?: PlanningSummary
  findings?: Partial<Record<PipelineStep, string[]>>
  latency?: Partial<Record<PipelineStep, number>>
  completed?: PipelineStep[]
}

export type RunStatus = "queued" | "running" | "succeeded" | "failed"

export interface StepView {
  step: PipelineStep
  status: "pending" | "running" | "done" | "failed"
  tools: ToolLine[]
  findings: string[]
  latencyMs: number | null
}

export interface RunView {
  id: string
  venueId: string
  weekday: Weekday
  status: RunStatus
  errorMessage: string | null
  createdAt: string
  steps: StepView[]
  genericRunId: string | null
  genericAnswer: string | null
  scout: Scout | null
  fingerprint: TasteFingerprint | null
  gap: GapScan | null
}
