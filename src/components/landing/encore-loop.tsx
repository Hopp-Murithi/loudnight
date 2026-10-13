import { Check } from "lucide-react"
import { ENCORE_LOOP } from "@/config/landing"
import { TYPE } from "@/lib/typography"

// Decide, execute, promote, measure. A real sequence, so the steps are numbered and joined.
export function EncoreLoop() {
  return (
    <section aria-labelledby="loop-heading" className="space-y-8">
      <div className="space-y-3">
        <h2 id="loop-heading" className={TYPE.h1}>
          Not just an idea. The whole night.
        </h2>
        <p className={TYPE.lead}>
          Encore stays with the night from the first idea to the last guest, then uses the count to plan next week.
        </p>
      </div>
      <ol className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {ENCORE_LOOP.map((stage, index) => (
          <li key={stage.stage} className="flex min-w-0 flex-col gap-4 bg-background p-6">
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-medium text-muted-foreground tabular-nums">{index + 1}</span>
              <h3 className="font-display text-4xl leading-none font-bold">{stage.stage}</h3>
            </div>
            <p className="text-sm">{stage.summary}</p>
            <ul className="mt-auto space-y-2 text-sm text-muted-foreground">
              {stage.makes.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  )
}
