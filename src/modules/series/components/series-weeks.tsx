import { ArrowRight, CalendarDays, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CONCEPT_FORMAT_LABELS } from "@/config/concepts"
import { ROUTES } from "@/config/site"
import { formatLocalDate, formatMoney } from "@/lib/format"
import type { ConceptView } from "@/modules/concepts/concepts.schemas"

const WEEK_NAMES = ["Opening night", "Week two", "Week three", "Finale"]

// The chosen night and the four dates it runs on. Each week's twist and performers are drafted by the series planner.
export function SeriesWeeks({ venueId, concept, nights }: { venueId: string; concept: ConceptView; nights: string[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <article
        aria-labelledby="chosen-night"
        className="relative flex flex-col gap-4 overflow-hidden border bg-card p-6 sm:p-8"
      >
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-spotlight" />
        <p className="text-sm text-muted-foreground">{CONCEPT_FORMAT_LABELS[concept.format]}, your chosen night</p>
        <h2 id="chosen-night" className="font-display text-4xl leading-none font-bold text-balance">
          {concept.name}
        </h2>
        <p className="text-muted-foreground">{concept.pitch}</p>
        <dl className="flex gap-8 border-t pt-4">
          <div>
            <dt className="text-xs text-muted-foreground">Score</dt>
            <dd className="font-display text-3xl font-bold tabular-nums">{concept.scores.total}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">About</dt>
            <dd className="font-display text-3xl font-bold tabular-nums">{formatMoney(concept.estimatedCostCents)}</dd>
          </div>
        </dl>
        <Button
          className="mt-auto self-start"
          variant="outline"
          nativeButton={false}
          render={<Link href={ROUTES.venuePlan(venueId)} />}
        >
          Compare the other nights
        </Button>
      </article>

      <section aria-labelledby="weeks-heading" className="space-y-3">
        <h2 id="weeks-heading" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CalendarDays aria-hidden className="size-4" />
          The next four weeks
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {nights.map((night, index) => (
            <li key={night} className="flex gap-4 border bg-card p-4">
              <time dateTime={night} className="flex w-14 shrink-0 flex-col items-center border py-1.5 leading-none">
                <span className="text-xs text-muted-foreground">{formatLocalDate(night, { month: "short" })}</span>
                <span className="font-display text-3xl font-bold">{formatLocalDate(night, { day: "numeric" })}</span>
              </time>
              <div className="min-w-0">
                <p className="font-medium">{WEEK_NAMES[index]}</p>
                <p className="text-sm text-muted-foreground">{formatLocalDate(night, { weekday: "long" })}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          Each week gets its own twist, and performers whose fans live nearby. Encore drafts them here, ready for you to
          book.
        </p>
        <Link
          href={ROUTES.venueDoor(venueId)}
          className="inline-flex items-center gap-1 text-sm text-link underline-offset-4 hover:underline"
        >
          How the door works on the night
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </section>
    </div>
  )
}
