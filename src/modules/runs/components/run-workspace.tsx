"use client"

import { useState } from "react"
import { ReceiptSheet } from "@/modules/concepts/components/receipt-sheet"
import type { ConceptView } from "@/modules/concepts/concepts.schemas"
import { useRun } from "../hooks/use-run"
import { useGenericAnswer, useShortlist } from "../hooks/use-run-queries"
import type { RunView } from "../runs.schemas"
import { RunDetails } from "./run-details"
import { RunStage } from "./run-stage"
import { RunOutcome } from "./run-outcome"
import { RunTrace } from "./run-trace"

interface RunWorkspaceProps {
  initial: RunView
  initialConcepts: ConceptView[]
  canRun: boolean
  radiusMetres: number
  currency: string
}

// While it plans the page is one stage. Once done it is the nights, with the working behind them one tab away.
export function RunWorkspace({ initial, initialConcepts, canRun, radiusMetres, currency }: RunWorkspaceProps) {
  const run = useRun(initial, canRun)
  const scored = run.steps.find((step) => step.step === "score")?.status === "done"
  const shortlist = useShortlist(initial.id, initialConcepts, scored)
  const generic = useGenericAnswer(initial.id, initial.genericAnswer, canRun)
  const [callId, setCallId] = useState<string | null>(null)

  const traceProps = {
    steps: run.steps,
    error: run.error,
    onRetry: canRun ? run.retry : undefined,
    retrying: run.driving,
  }

  if (!run.finished) return <RunStage {...traceProps} />

  return (
    <>
      <RunOutcome
        concepts={shortlist.data}
        ready={scored}
        canChoose={canRun}
        venueId={initial.venueId}
        currency={currency}
        generic={{ answer: generic.data, loading: generic.isFetching && !generic.data, failed: generic.isError }}
      />
      <RunDetails
        view={run.view}
        steps={run.steps}
        radiusMetres={radiusMetres}
        onOpenCall={setCallId}
        trace={<RunTrace {...traceProps} />}
      />
      <ReceiptSheet source={callId ? { kind: "call", id: callId } : null} onClose={() => setCallId(null)} />
    </>
  )
}
