"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConceptShortlist } from "@/modules/concepts/components/concept-shortlist"
import type { ConceptView } from "@/modules/concepts/concepts.schemas"
import { GenericAnswer } from "./generic-answer"

interface RunOutcomeProps {
  concepts: ConceptView[] | undefined
  ready: boolean
  canChoose: boolean
  generic: { answer: string | undefined; loading: boolean; failed: boolean }
  first?: "encore" | "generic"
  venueId?: string
  currency: string
}

function Waiting() {
  return (
    <div className="space-y-3" role="status" aria-label="The nights appear here when they pass the evidence check">
      <p className="text-sm text-muted-foreground">
        Your three nights appear here as soon as they pass the evidence check.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-80" />
        ))}
      </div>
    </div>
  )
}

// Loudnight's nights against a plain chatbot's answer for the same venue: the reason Qloo matters, side by side.
export function RunOutcome({
  concepts,
  ready,
  canChoose,
  generic,
  first = "encore",
  venueId,
  currency,
}: RunOutcomeProps) {
  const encore =
    ready && concepts ? (
      <ConceptShortlist concepts={concepts} currency={currency} canChoose={canChoose} venueId={venueId} />
    ) : (
      <Waiting />
    )
  const plain = <GenericAnswer {...generic} />

  return (
    <Tabs defaultValue={first} className="gap-5">
      <TabsList aria-label="Compare answers">
        <TabsTrigger value="encore">Loudnight</TabsTrigger>
        <TabsTrigger value="generic">Generic AI</TabsTrigger>
        <TabsTrigger value="both" className="hidden lg:inline-flex">
          Side by side
        </TabsTrigger>
      </TabsList>
      <TabsContent value="encore">{encore}</TabsContent>
      <TabsContent value="generic">{plain}</TabsContent>
      <TabsContent value="both">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          {plain}
          <div className="min-w-0 [&_ul]:xl:grid-cols-2">{encore}</div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
