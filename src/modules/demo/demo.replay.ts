import type { StepView } from "@/modules/runs/runs.schemas"

export const REPLAY_STEP_MS = 900

// The stored trace as it looked part way through: steps before `shown` are finished, the one at it is running.
export function replayFrame(steps: StepView[], shown: number | null): StepView[] {
  if (shown === null || shown >= steps.length) return steps
  return steps.map((step, index) => {
    if (index < shown) return step
    if (index === shown) return { ...step, status: "running", latencyMs: null }
    return { ...step, status: "pending", tools: [], findings: [], latencyMs: null }
  })
}
