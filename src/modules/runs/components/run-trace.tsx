"use client"

import { Stepper, type StepItem } from "@/components/shared/stepper"
import { Button } from "@/components/ui/button"
import { PIPELINE } from "@/config/runs"
import type { StepView } from "../runs.schemas"
import { seconds, ToolLines } from "./tool-lines"

interface RunTraceProps {
  steps: StepView[]
  error: { step: string; message: string } | null
  onRetry?: () => void
  retrying: boolean
}

const STATUS: Record<StepView["status"], StepItem["status"]> = {
  pending: "pending",
  running: "running",
  done: "done",
  failed: "failed",
}

// The six steps as they happen. Screen readers hear when a step starts, not every line inside it.
export function RunTrace({ steps, error, onRetry, retrying }: RunTraceProps) {
  const running = steps.find((step) => step.status === "running")
  const label = (step: string) => PIPELINE.find((entry) => entry.step === step)?.label ?? step
  const items: StepItem[] = steps.map((step) => {
    const failed = error?.step === step.step || step.status === "failed"
    return {
      id: step.step,
      label: label(step.step),
      status: failed ? "failed" : STATUS[step.status],
      meta: step.status === "done" ? seconds(step.latencyMs) : undefined,
      detail: (
        <div className="space-y-2">
          {step.findings.length > 0 && (
            <ul className="space-y-1 text-sm">
              {step.findings.map((finding) => (
                <li key={finding}>{finding}</li>
              ))}
            </ul>
          )}
          {failed && error && (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{error.message}</p>
              {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry} disabled={retrying}>
                  Try this step again
                </Button>
              )}
            </div>
          )}
          <ToolLines lines={step.tools} />
        </div>
      ),
    }
  })

  return (
    <div className="space-y-4">
      <p role="status" aria-live="polite" className="sr-only">
        {running ? `${label(running.step)}.` : ""}
      </p>
      <Stepper steps={items} />
    </div>
  )
}
