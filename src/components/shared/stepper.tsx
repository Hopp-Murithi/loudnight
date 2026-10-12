import { CircleCheck, CircleDashed, CircleX, LoaderCircle, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type StepStatus = "pending" | "running" | "done" | "failed"

export interface StepItem {
  id: string
  label: string
  status: StepStatus
  detail?: ReactNode
  meta?: string
}

const STATUS: Record<StepStatus, { icon: LucideIcon; text: string; className: string }> = {
  pending: { icon: CircleDashed, text: "Not started", className: "text-muted-foreground" },
  running: {
    icon: LoaderCircle,
    text: "In progress",
    className: "text-primary animate-spin motion-reduce:animate-none",
  },
  done: { icon: CircleCheck, text: "Done", className: "text-success" },
  failed: { icon: CircleX, text: "Failed", className: "text-destructive" },
}

// A vertical sequence: the live trace, onboarding progress. Each step says its state in words for screen readers.
export function Stepper({ steps, className }: { steps: StepItem[]; className?: string }) {
  return (
    <ol className={cn("relative space-y-5", className)}>
      {steps.map((step, index) => {
        const { icon: Icon, text, className: iconClass } = STATUS[step.status]
        return (
          <li
            key={step.id}
            className="relative flex min-w-0 gap-3"
            aria-current={step.status === "running" ? "step" : undefined}
          >
            {index < steps.length - 1 && (
              <span aria-hidden className="absolute top-6 bottom-[-1.25rem] left-2 w-px bg-border" />
            )}
            <Icon className={cn("relative mt-0.5 size-4 shrink-0 bg-background", iconClass)} aria-hidden />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className={cn("text-sm font-medium", step.status === "pending" && "text-muted-foreground")}>
                  {step.label}
                  <span className="sr-only">, {text}</span>
                </p>
                {step.meta && <span className="text-xs text-muted-foreground tabular-nums">{step.meta}</span>}
              </div>
              {step.detail && <div className="text-sm text-muted-foreground">{step.detail}</div>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
