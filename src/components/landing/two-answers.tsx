import { Sparkles } from "lucide-react"
import { MeterBar } from "@/components/shared/meter-bar"
import { GENERIC_IDEAS, OWNER_QUESTION, SAMPLE_CONCEPT, SAMPLE_RECEIPTS } from "@/config/landing"
import { TYPE } from "@/lib/typography"

// The hook from the brief: the same question, answered by a general chatbot and by Encore.
export function TwoAnswers() {
  return (
    <section aria-labelledby="answers-heading" className="space-y-8">
      <div className="space-y-3">
        <h2 id="answers-heading" className={TYPE.h1}>
          Same quiet Tuesday. Two answers.
        </h2>
        <p className={TYPE.lead}>
          The owner asks: <q className="text-foreground">{OWNER_QUESTION}</q>
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <article aria-labelledby="generic-answer" className="flex flex-col gap-5 bg-muted/60 p-6 sm:p-8">
          <h3 id="generic-answer" className="font-semibold text-muted-foreground">
            A general chatbot
          </h3>
          <ul className="space-y-3 text-lg text-muted-foreground">
            {GENERIC_IDEAS.map((idea) => (
              <li key={idea} className="border-b border-border pb-3 last:border-0">
                {idea}
              </li>
            ))}
          </ul>
          <p className="mt-auto text-sm text-muted-foreground">
            The same list any bar in any city gets. No reason, no numbers, nothing to check.
          </p>
        </article>
        <article
          aria-labelledby="encore-answer"
          className="flex flex-col gap-5 border-2 border-primary bg-card p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 id="encore-answer" className="flex items-center gap-2 font-semibold text-primary">
              <Sparkles aria-hidden className="size-4" />
              Encore
            </h3>
            <span className="border px-2 py-0.5 text-xs text-muted-foreground">Sample</span>
          </div>
          <div className="space-y-2">
            <p className={TYPE.h1}>{SAMPLE_CONCEPT.name}</p>
            <p className="text-muted-foreground">{SAMPLE_CONCEPT.pitch}</p>
          </div>
          <MeterBar
            label="Fit for this venue"
            value={SAMPLE_CONCEPT.fit}
            max={100}
            valueText={`${SAMPLE_CONCEPT.fit} of 100`}
            tone="success"
          />
          <ul aria-label="Evidence" className="flex flex-wrap gap-2">
            {SAMPLE_RECEIPTS.map((receipt) => (
              <li key={receipt.chip} className="border border-spotlight/60 bg-spotlight/12 px-2.5 py-1 text-sm">
                {receipt.chip}
              </li>
            ))}
          </ul>
          <p className="mt-auto text-sm text-muted-foreground">{SAMPLE_CONCEPT.why}</p>
        </article>
      </div>
    </section>
  )
}
