"use client"

import { PIPELINE } from "@/config/runs"
import { cn } from "@/lib/utils"
import type { StepView } from "../runs.schemas"
import { RunTrace } from "./run-trace"

interface RunStageProps {
  steps: StepView[]
  error: { step: string; message: string } | null
  onRetry?: () => void
  retrying: boolean
}

// While a plan is being made the page is one stage: the step happening now, how far along, and what was found.
export function RunStage({ steps, error, onRetry, retrying }: RunStageProps) {
  const done = steps.filter((step) => step.status === "done").length
  const current = steps.find((step) => step.status !== "done") ?? steps[steps.length - 1]
  const entry = PIPELINE.find((item) => item.step === current?.step)
  const latest = current?.findings[current.findings.length - 1]
  const position = Math.min(done + 1, steps.length)

  return (
    <section
      aria-labelledby="trace-heading"
      className="dark poster-glow grid gap-10 p-6 text-foreground sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {!error && <span aria-hidden className="live-dot size-2 rounded-full bg-success" />}
          {error ? "The plan stopped part way" : "Loudnight is planning"}, step {position} of {steps.length}
        </p>
        <div className="space-y-3">
          <h2
            id="trace-heading"
            className="font-display text-5xl leading-[0.9] font-extrabold text-balance sm:text-6xl"
          >
            {entry?.label}
          </h2>
          <p key={latest ?? entry?.what} className="poster-in max-w-xl text-lg text-muted-foreground">
            {latest ?? entry?.what}
          </p>
        </div>
        <div
          role="meter"
          aria-label="Steps finished"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={done}
          aria-valuetext={`${done} of ${steps.length} steps finished`}
          className="mt-auto flex gap-1.5"
        >
          {steps.map((step) => (
            <span
              key={step.step}
              className={cn(
                "h-1.5 flex-1 transition-colors duration-500",
                step.status === "done" && "bg-spotlight",
                step.status === "running" && "live-dot bg-spotlight/60",
                step.status !== "done" && step.status !== "running" && "bg-muted",
              )}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          About a minute. Your three nights appear here when they pass the evidence check. If you leave, the plan picks
          up where it stopped.
        </p>
      </div>
      <div className="min-w-0 border-t border-border pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
        <RunTrace steps={steps} error={error} onRetry={onRetry} retrying={retrying} />
      </div>
    </section>
  )
}
