"use client"

import { Check } from "lucide-react"
import Link from "next/link"
import { MeterBar } from "@/components/shared/meter-bar"
import type { LogisticsId } from "@/config/readiness"
import { formatLocalDate } from "@/lib/format"
import { TYPE } from "@/lib/typography"
import { cn } from "@/lib/utils"
import { useChecklist } from "../hooks/use-checklist"
import type { ReadinessView } from "../readiness.service"

function Mark({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-6 shrink-0 place-items-center border",
        done ? "border-success bg-success text-background" : "border-input",
      )}
    >
      {done && <Check className="size-4" />}
    </span>
  )
}

// What is ready for the chosen night and what still needs the owner, in one list they can work down.
export function ReadinessCard({ readiness, canEdit }: { readiness: ReadinessView; canEdit: boolean }) {
  const ticked = readiness.logistics.filter((item) => item.done).map((item) => item.id)
  const checklist = useChecklist(readiness.night?.id ?? null, ticked)
  const done = readiness.steps.filter((step) => step.done).length + checklist.done.length
  const night = readiness.night
  const when = night ? formatLocalDate(night.localDate, { weekday: "long", month: "long", day: "numeric" }) : null

  return (
    <section aria-labelledby="readiness-heading" className="space-y-6 border bg-card p-6 sm:p-8">
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 id="readiness-heading" className={TYPE.h2}>
            Getting it ready
          </h2>
          <p className="text-sm text-muted-foreground">
            {when ? `Everything ${when} needs, in order.` : "Everything your night needs, in order."}
          </p>
        </div>
        <MeterBar
          label="Ready"
          value={done}
          max={readiness.total}
          valueText={`${done} of ${readiness.total}`}
          tone={done === readiness.total ? "success" : "info"}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <ol className="space-y-1">
          {readiness.steps.map((step) => (
            <li key={step.id}>
              <Link
                href={step.href}
                className="group flex items-start gap-3 px-2 py-2.5 outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Mark done={step.done} />
                <span className="min-w-0 flex-1">
                  <span className={cn("block font-medium", step.done && "text-muted-foreground")}>
                    {step.label}
                    <span className="sr-only">{step.done ? ", done" : ", to do"}</span>
                  </span>
                  <span className="block text-sm text-muted-foreground">{step.hint}</span>
                </span>
                {!step.done && <span className="mt-0.5 shrink-0 text-sm text-link group-hover:underline">Do it</span>}
              </Link>
            </li>
          ))}
        </ol>

        <fieldset disabled={!canEdit || !night} className="space-y-1">
          <legend className="mb-2 text-sm font-medium">
            On the night
            {!night && <span className="font-normal text-muted-foreground"> (opens once the four weeks exist)</span>}
          </legend>
          {readiness.logistics.map((item) => {
            const isDone = checklist.done.includes(item.id as LogisticsId)
            return (
              <label
                key={item.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 px-2 py-2 hover:bg-muted/60 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:cursor-default has-disabled:opacity-60"
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isDone}
                  onChange={() => checklist.toggle(item.id)}
                />
                <Mark done={isDone} />
                <span className={cn(isDone && "text-muted-foreground")}>{item.label}</span>
              </label>
            )
          })}
        </fieldset>
      </div>
    </section>
  )
}
