"use client"

import Link from "next/link"
import { useState } from "react"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/site"
import type { ConceptView } from "../concepts.schemas"
import { ConceptCard } from "./concept-card"
import { ReceiptSheet } from "./receipt-sheet"

interface ConceptShortlistProps {
  concepts: ConceptView[]
  currency: string
  canChoose: boolean
  // Given on a venue's own pages, so the chosen night can point at what comes next.
  venueId?: string
}

const ROW =
  "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0"

// Before a choice, three nights side by side. After it, the page locks onto the chosen one and folds the rest away.
export function ConceptShortlist({ concepts, currency, canChoose, venueId }: ConceptShortlistProps) {
  const [openEvidence, setOpenEvidence] = useState<string | null>(null)
  const chosen = concepts.find((concept) => concept.chosen)
  const others = concepts.filter((concept) => concept !== chosen)
  const card = (concept: ConceptView) => (
    <ConceptCard concept={concept} currency={currency} canChoose={canChoose} onOpenReceipt={setOpenEvidence} />
  )

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
      {chosen ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
            <div className="poster-in min-w-0">{card(chosen)}</div>
            <section aria-labelledby="locked-heading" className="space-y-4 border bg-card p-6 lg:sticky lg:top-20">
              <h3 id="locked-heading" className="font-display text-3xl leading-none font-bold text-balance">
                {chosen.name} is your night.
              </h3>
              <p className="text-sm text-muted-foreground">
                Everything from here is built around it: the four weeks, who plays, the ads, and the door.
              </p>
              {venueId && canChoose && (
                <div className="flex flex-wrap gap-2">
                  <Button size="lg" nativeButton={false} render={<Link href={ROUTES.venueSeries(venueId)} />}>
                    Plan the four weeks
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href={ROUTES.venuePromote(venueId)} />}
                  >
                    Make the ads
                  </Button>
                  <Button size="lg" variant="ghost" nativeButton={false} render={<Link href={ROUTES.venue(venueId)} />}>
                    See what is left to do
                  </Button>
                </div>
              )}
            </section>
          </div>
          {others.length > 0 && (
            <details className="group border-t pt-4">
              <summary className="cursor-pointer text-sm text-link underline-offset-4 hover:underline">
                <span className="group-open:hidden">Show the {others.length} nights you did not pick</span>
                <span className="hidden group-open:inline">Hide the nights you did not pick</span>
              </summary>
              <ul className={`${ROW} mt-4`}>
                {others.map((concept) => (
                  <li key={concept.id} className="w-[86%] min-w-0 shrink-0 snap-center md:w-auto">
                    {card(concept)}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ) : (
        <ul className={`${ROW} xl:grid-cols-3`}>
          {concepts.map((concept, index) => (
            <li
              key={concept.id}
              className="poster-in w-[86%] min-w-0 shrink-0 snap-center md:w-auto"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              {card(concept)}
            </li>
          ))}
        </ul>
      )}
      <ReceiptSheet
        source={openEvidence ? { kind: "evidence", id: openEvidence } : null}
        onClose={() => setOpenEvidence(null)}
      />
    </>
  )
}
