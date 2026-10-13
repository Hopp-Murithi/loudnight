"use client"

import { CircleCheck, Sparkles, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CONCEPT_FORMAT_LABELS } from "@/config/concepts"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ConceptView } from "../concepts.schemas"
import { useChooseConcept } from "../hooks/use-choose-concept"
import { EvidenceChip } from "./evidence-chip"
import { ScoreBreakdown } from "./score-breakdown"

interface ConceptCardProps {
  concept: ConceptView
  canChoose: boolean
  onOpenReceipt: (evidenceId: string) => void
}

function Marker({ concept }: { concept: ConceptView }) {
  if (concept.chosen) {
    return (
      <span className="inline-flex items-center gap-1 bg-spotlight px-2 py-0.5 font-medium text-primary-foreground">
        <CircleCheck aria-hidden className="size-3.5" />
        Your night
      </span>
    )
  }
  if (concept.rank !== 1) return null
  return (
    <span className="inline-flex items-center gap-1 border border-spotlight/60 px-2 py-0.5 text-spotlight">
      <Star aria-hidden className="size-3.5" />
      Encore&apos;s pick
    </span>
  )
}

// One night as a gig poster with its ticket stub: the poster sells it, the stub proves it, then the choice.
export function ConceptCard({ concept, canChoose, onOpenReceipt }: ConceptCardProps) {
  const choose = useChooseConcept()

  return (
    <article
      aria-labelledby={`concept-${concept.id}`}
      className={cn(
        "flex h-full min-w-0 flex-col overflow-hidden border bg-card",
        concept.chosen && "border-spotlight ring-1 ring-spotlight",
      )}
    >
      <div className="dark poster-glow space-y-6 p-6 text-foreground">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{CONCEPT_FORMAT_LABELS[concept.format]}</span>
          <Marker concept={concept} />
        </div>
        <div className="space-y-3">
          <h3 id={`concept-${concept.id}`} className="font-display text-4xl leading-[0.9] font-extrabold text-balance">
            {concept.name}
          </h3>
          <p className="text-sm text-muted-foreground">{concept.pitch}</p>
        </div>
        <ScoreBreakdown scores={concept.scores} />
      </div>

      <div aria-hidden className="h-px border-t-2 border-dashed border-border" />

      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">The evidence</h4>
          <ul className="space-y-1.5">
            {concept.evidence.map((item) => (
              <li key={item.id}>
                <EvidenceChip evidence={item} onOpen={onOpenReceipt} />
              </li>
            ))}
          </ul>
        </div>

        <p className="flex gap-2 text-sm">
          <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{concept.reasonBeatsNearby}</span>
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-sm">
            <span className="text-muted-foreground">About </span>
            <span className="font-medium tabular-nums">{formatMoney(concept.estimatedCostCents)}</span>
            <span className="text-muted-foreground"> a night</span>
          </p>
          {canChoose && !concept.chosen && (
            <Button size="lg" onClick={() => choose.mutate(concept.id)} disabled={choose.isPending}>
              {choose.isPending ? "Choosing" : "Choose this night"}
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
