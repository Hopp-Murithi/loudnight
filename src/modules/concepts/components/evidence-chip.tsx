"use client"

import { BadgeCheck } from "lucide-react"
import { formatAffinity } from "../concepts.grounding"
import type { ConceptEvidence } from "../concepts.schemas"

// A claim and its number. The whole chip is a button: the number always opens the answer it came from.
export function EvidenceChip({ evidence, onOpen }: { evidence: ConceptEvidence; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(evidence.id)}
      className="group flex w-full min-w-0 items-center gap-2.5 border border-spotlight/50 bg-spotlight/10 py-1.5 pr-1.5 pl-2.5 text-left text-sm transition-colors outline-none hover:border-spotlight hover:bg-spotlight/20 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <BadgeCheck aria-hidden className="size-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1">{evidence.claim}</span>
      <span className="shrink-0 bg-background px-1.5 py-0.5 text-xs tabular-nums">
        <span className="sr-only">Qloo affinity </span>
        {formatAffinity(evidence.value)}
      </span>
      <span className="sr-only">, open the receipt</span>
    </button>
  )
}
