"use client"

import { useState } from "react"
import { EmptyState } from "@/components/shared/empty-state"
import type { ConceptView } from "../concepts.schemas"
import { ConceptCard } from "./concept-card"
import { ReceiptSheet } from "./receipt-sheet"

interface ConceptShortlistProps {
  concepts: ConceptView[]
  canChoose: boolean
}

// The three best nights: side by side on a laptop, a swipeable row on a phone. One receipt sheet serves every chip.
export function ConceptShortlist({ concepts, canChoose }: ConceptShortlistProps) {
  const [openEvidence, setOpenEvidence] = useState<string | null>(null)

  if (concepts.length === 0) {
    return (
      <EmptyState
        title="No night passed the evidence check"
        description="Every idea needs at least two claims Qloo can back. Try a wider search radius in settings, then plan again."
      />
    )
  }

  return (
    <>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3">
        {concepts.map((concept, index) => (
          <li
            key={concept.id}
            className="poster-in w-[86%] min-w-0 shrink-0 snap-center md:w-auto"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <ConceptCard concept={concept} canChoose={canChoose} onOpenReceipt={setOpenEvidence} />
          </li>
        ))}
      </ul>
      <ReceiptSheet
        source={openEvidence ? { kind: "evidence", id: openEvidence } : null}
        onClose={() => setOpenEvidence(null)}
      />
    </>
  )
}
