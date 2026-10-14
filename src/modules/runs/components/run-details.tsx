"use client"

import type { ReactNode } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TYPE } from "@/lib/typography"
import { GapScanCard } from "@/modules/gap/components/gap-scan-card"
import { TasteFingerprintCard } from "@/modules/taste/components/taste-fingerprint-card"
import type { RunView, StepView } from "../runs.schemas"
import { PoweredByQloo } from "./powered-by-qloo"

interface RunDetailsProps {
  view: RunView
  steps: StepView[]
  radiusMetres: number
  onOpenCall: (stepId: string) => void
  trace?: ReactNode
}

// The working behind the nights, one tab at a time, so the page stays about the answer.
function totals(steps: StepView[]) {
  const qloo = steps.flatMap((step) => step.tools).filter((line) => line.source === "Qloo")
  const ms = steps.reduce((sum, step) => sum + (step.latencyMs ?? 0), 0)
  const time =
    ms >= 60_000 ? `${Math.floor(ms / 60_000)} min ${Math.round((ms % 60_000) / 1000)} s` : `${Math.round(ms / 1000)} s`
  return [
    { label: "steps", value: `${steps.filter((step) => step.status === "done").length} of ${steps.length}` },
    { label: "to plan", value: time },
    { label: "Qloo calls", value: String(qloo.length) },
    { label: "from cache", value: String(qloo.filter((line) => line.fromCache).length) },
  ]
}

export function RunDetails({ view, steps, radiusMetres, onOpenCall, trace }: RunDetailsProps) {
  const hasCalls = steps.some((step) => step.tools.some((line) => line.source === "Qloo"))
  const tabs = [
    view.fingerprint && { value: "taste", label: "Taste" },
    view.gap && { value: "nearby", label: "Nearby" },
    trace && { value: "steps", label: "Steps" },
    hasCalls && { value: "calls", label: "Qloo calls" },
  ].filter((tab): tab is { value: string; label: string } => Boolean(tab))
  const first = tabs[0]
  if (!first) return null

  return (
    <section id="details" aria-labelledby="details-heading" className="scroll-mt-6 space-y-4">
      <div className="space-y-1">
        <h2 id="details-heading" className={TYPE.h2}>
          How Loudnight got there
        </h2>
        <p className="text-sm text-muted-foreground">What the planner read before it suggested anything.</p>
      </div>
      <Tabs defaultValue={first.value} className="gap-6">
        <TabsList aria-label="How Loudnight got there" className="max-w-full overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {view.fingerprint && (
          <TabsContent value="taste">
            <TasteFingerprintCard fingerprint={view.fingerprint} />
          </TabsContent>
        )}
        {view.gap && (
          <TabsContent value="nearby">
            <GapScanCard scan={view.gap} scout={view.scout} radiusMetres={radiusMetres} />
          </TabsContent>
        )}
        {trace && (
          <TabsContent value="steps" className="space-y-6 border bg-card p-5">
            <dl className="flex flex-wrap gap-x-8 gap-y-2">
              {totals(steps).map((item) => (
                <div key={item.label} className="flex items-baseline gap-1.5">
                  <dd className="font-display text-2xl leading-none font-bold tabular-nums">{item.value}</dd>
                  <dt className="text-xs text-muted-foreground">{item.label}</dt>
                </div>
              ))}
            </dl>
            {trace}
          </TabsContent>
        )}
        <TabsContent value="calls">
          <PoweredByQloo steps={steps} onOpen={onOpenCall} />
        </TabsContent>
      </Tabs>
    </section>
  )
}
