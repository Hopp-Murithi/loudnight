"use client"

import type { StepView, ToolLine } from "@/modules/runs/runs.schemas"
import { GenericAnswer } from "@/modules/runs/components/generic-answer"
import { PoweredByQloo } from "@/modules/runs/components/powered-by-qloo"
import { RunStage } from "@/modules/runs/components/run-stage"
import { RunTrace } from "@/modules/runs/components/run-trace"
import { GallerySection, Specimen } from "./gallery-section"

// Made-up sample values for checking the layout. Never real upstream data.
const line = (id: string, source: ToolLine["source"], label: string, fromCache = false): ToolLine => ({
  id,
  tool: source === "Qloo" ? "qloo.insights" : "places.nearby",
  source,
  label,
  ok: true,
  latencyMs: 640,
  fromCache,
  hasReceipt: source === "Qloo",
})

const STEPS: StepView[] = [
  {
    step: "scout",
    status: "done",
    tools: [line("a", "Google Places", "Your venue as Google sees it")],
    findings: ["Bar, rated 4.4 from 812 reviews"],
    latencyMs: 1200,
  },
  {
    step: "read_neighbourhood",
    status: "done",
    tools: [
      line("b", "Qloo", "What people nearby love: music styles", true),
      line("c", "Qloo", "What people nearby love: films"),
    ],
    findings: ["11 of 11 areas of taste read from Qloo", "Music people love here: Sample soul, Sample folk"],
    latencyMs: 6800,
  },
  { step: "find_gap", status: "failed", tools: [], findings: [], latencyMs: null },
  { step: "generate_concepts", status: "pending", tools: [], findings: [], latencyMs: null },
  { step: "score", status: "pending", tools: [], findings: [], latencyMs: null },
  { step: "plan", status: "pending", tools: [], findings: [], latencyMs: null },
]

const LIVE: StepView[] = STEPS.map((step) => (step.step === "find_gap" ? { ...step, status: "running" } : step))

export function RunsSection() {
  return (
    <GallerySection
      title="Planning run"
      description="The stage while planning, the trace mid-run with a failed step, the generic answer and the Qloo panel."
    >
      <Specimen label="Stage, while planning">
        <div className="w-full">
          <RunStage steps={LIVE} error={null} retrying={false} />
        </div>
      </Specimen>
      <Specimen label="Trace">
        <div className="w-full max-w-sm border p-5">
          <RunTrace
            steps={STEPS}
            error={{ step: "find_gap", message: "Ticketmaster did not answer. Try again in a moment." }}
            onRetry={() => undefined}
            retrying={false}
          />
        </div>
      </Specimen>
      <Specimen label="Generic answer">
        <div className="w-full max-w-lg">
          <GenericAnswer
            answer={"1. Trivia night: a weekly quiz.\n2. Karaoke: a sing-along night.\n3. Happy hour: cheaper drinks."}
            loading={false}
            failed={false}
          />
        </div>
      </Specimen>
      <Specimen label="Powered by Qloo">
        <div className="w-full max-w-2xl">
          <PoweredByQloo steps={STEPS} onOpen={() => undefined} />
        </div>
      </Specimen>
    </GallerySection>
  )
}
