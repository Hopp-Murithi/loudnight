"use client"

import Link from "next/link"
import { SubmitButton } from "@/components/forms/submit-button"
import { CONCEPT_FORMAT_LABELS } from "@/config/concepts"
import { ROUTES } from "@/config/site"
import type { ConceptView } from "@/modules/concepts/concepts.schemas"
import { useCreateSeries } from "../hooks/use-series"

interface SeriesPosterProps {
  venueId: string
  concept: ConceptView
  night: string
  hasSeries: boolean
  canEdit: boolean
}

// The chosen night on its poster. Until the series exists, this is also where it gets made: one button.
export function SeriesPoster({ venueId, concept, night, hasSeries, canEdit }: SeriesPosterProps) {
  const create = useCreateSeries()

  return (
    <section
      aria-labelledby="series-night"
      className="dark poster-glow flex flex-col gap-5 p-6 text-foreground sm:p-8 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="min-w-0 space-y-3">
        <p className="text-sm text-muted-foreground">
          {CONCEPT_FORMAT_LABELS[concept.format]}, your {night} night
        </p>
        <h2 id="series-night" className="font-display text-5xl leading-[0.9] font-extrabold text-balance sm:text-6xl">
          {concept.name}
        </h2>
        <p className="max-w-xl text-muted-foreground">{concept.pitch}</p>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
        {!hasSeries && canEdit && (
          <SubmitButton
            type="button"
            size="lg"
            pending={create.isPending}
            pendingLabel="Planning four weeks"
            onClick={() => create.mutate(concept.id)}
          >
            Make it four weeks
          </SubmitButton>
        )}
        {!hasSeries && !canEdit && (
          <p className="text-sm text-muted-foreground">An owner or manager turns this into a series.</p>
        )}
        <Link href={ROUTES.venuePlan(venueId)} className="text-sm text-link underline-offset-4 hover:underline">
          Compare the other nights
        </Link>
      </div>
    </section>
  )
}
