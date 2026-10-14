import { formatAffinity } from "../concepts.grounding"
import type { ReceiptView } from "../concepts.schemas"

const format = (value: unknown) => (Array.isArray(value) ? value.join(", ") : String(value))

// The answer as Qloo sent it, with the cited line marked so the number can be checked by eye.
function AnswerSlice({ slice, highlight }: { slice: unknown; highlight: string[] }) {
  const lines = JSON.stringify(slice, null, 2).split("\n")
  const key = highlight.at(-1)
  const marked = key ? lines.findIndex((line) => line.trimStart().startsWith(`"${key}":`)) : -1

  return (
    <pre className="max-h-80 overflow-auto bg-muted/60 p-3 font-mono text-xs leading-relaxed">
      {lines.map((line, index) => (
        <span
          key={index}
          className={
            index === marked
              ? "-mx-3 block bg-spotlight/30 px-3 font-semibold text-foreground"
              : "block text-muted-foreground"
          }
        >
          {line}
        </span>
      ))}
    </pre>
  )
}

export function ReceiptBody({ receipt }: { receipt: ReceiptView }) {
  const fetched = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(receipt.fetchedAt),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3 border-b pb-5">
        <span className="font-display text-5xl leading-[0.8] font-extrabold tabular-nums">
          {receipt.value === null ? (receipt.resultCount ?? 0) : formatAffinity(receipt.value)}
        </span>
        <span className="text-sm text-muted-foreground">
          {receipt.value === null
            ? "results from Qloo, the first few shown below"
            : `Qloo affinity, stored exactly as ${receipt.value}`}
        </span>
      </div>

      <section aria-labelledby="receipt-question" className="space-y-2">
        <h3 id="receipt-question" className="text-sm font-semibold">
          What Loudnight asked Qloo
        </h3>
        <p className="font-mono text-xs">GET {receipt.endpoint}</p>
        <dl className="divide-y border text-xs">
          {Object.entries(receipt.params).map(([name, value]) => (
            <div key={name} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-3 py-2">
              <dt className="truncate font-mono text-muted-foreground">{name}</dt>
              <dd className="font-mono break-all">{format(value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="receipt-answer" className="space-y-2">
        <h3 id="receipt-answer" className="text-sm font-semibold">
          What Qloo answered
        </h3>
        <AnswerSlice slice={receipt.slice} highlight={receipt.highlight} />
      </section>

      <p className="text-xs text-muted-foreground">
        Fetched {fetched}. Powered by Qloo. A refreshed answer never replaces this one, so the number stays checkable.
      </p>
    </div>
  )
}
