"use client"

import { SkipForward } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TYPE } from "@/lib/typography"
import { ReceiptSheet } from "@/modules/concepts/components/receipt-sheet"
import type { ConceptView } from "@/modules/concepts/concepts.schemas"
import { RunDetails } from "@/modules/runs/components/run-details"
import { RunOutcome } from "@/modules/runs/components/run-outcome"
import { RunTrace } from "@/modules/runs/components/run-trace"
import type { RunView } from "@/modules/runs/runs.schemas"
import { useReplay } from "../hooks/use-replay"

interface DemoWorkspaceProps {
  run: RunView
  concepts: ConceptView[]
  radiusMetres: number
  plannedAt: string
  currency: string
}

// A finished plan, read only. The plain chatbot's answer comes first, because the contrast is the point.
export function DemoWorkspace({ run, concepts, radiusMetres, plannedAt, currency }: DemoWorkspaceProps) {
  const replay = useReplay(run.steps)
  const [callId, setCallId] = useState<string | null>(null)

  return (
    <>
      <section id="answers" aria-labelledby="answers-heading" className="scroll-mt-6 space-y-4">
        <div className="space-y-1">
          <h2 id="answers-heading" className={TYPE.h2}>
            Two answers to the same question
          </h2>
          <p className="text-sm text-muted-foreground">
            A general chatbot guesses. Encore reads the neighbourhood first, and every number opens its receipt.
          </p>
        </div>
        <RunOutcome
          currency={currency}
          first="generic"
          concepts={concepts}
          ready
          canChoose={false}
          generic={{ answer: run.genericAnswer ?? undefined, loading: false, failed: run.genericAnswer === null }}
        />
      </section>

      <RunDetails
        view={run}
        steps={run.steps}
        radiusMetres={radiusMetres}
        onOpenCall={setCallId}
        trace={
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Replay of the run from {plannedAt}.</p>
              {replay.playing ? (
                <Button variant="outline" onClick={replay.skip}>
                  <SkipForward aria-hidden className="size-4" />
                  Skip to the end
                </Button>
              ) : (
                <Button variant="outline" onClick={replay.play}>
                  Replay the run
                </Button>
              )}
            </div>
            <RunTrace steps={replay.steps} error={null} retrying={false} />
          </div>
        }
      />
      <ReceiptSheet source={callId ? { kind: "call", id: callId } : null} onClose={() => setCallId(null)} />
    </>
  )
}
