import { FileSearch } from "lucide-react"
import { SectionCard } from "@/components/shared/section-card"
import { Button } from "@/components/ui/button"
import type { StepView, ToolLine } from "../runs.schemas"
import { seconds } from "./tool-lines"

const VISIBLE = 8

// Every Qloo call in the plan, each with the stored answer behind it.
export function PoweredByQloo({ steps, onOpen }: { steps: StepView[]; onOpen: (stepId: string) => void }) {
  const calls = steps.flatMap((step) => step.tools).filter((line) => line.source === "Qloo")
  if (calls.length === 0) return null
  const cached = calls.filter((line) => line.fromCache).length

  const row = (line: ToolLine) => (
    <li key={line.id} className="flex min-w-0 items-center gap-3 py-2 text-sm">
      <span className="min-w-0 flex-1 truncate" title={line.label}>
        {line.label}
      </span>
      {line.fromCache && <span className="shrink-0 bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Cached</span>}
      <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
        {seconds(line.latencyMs)}
      </span>
      {line.hasReceipt && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onOpen(line.id)}
          aria-label={`Open the receipt: ${line.label}`}
        >
          <FileSearch aria-hidden className="size-4" />
          <span className="hidden sm:inline">Receipt</span>
        </Button>
      )}
    </li>
  )

  return (
    <SectionCard
      title="Powered by Qloo"
      description={`${calls.length} Qloo calls in this plan, ${cached} answered from Encore's cache.`}
    >
      <ul className="divide-y">{calls.slice(0, VISIBLE).map(row)}</ul>
      {calls.length > VISIBLE && (
        <details className="group">
          <summary className="cursor-pointer py-2 text-sm text-link underline-offset-4 group-open:hidden hover:underline">
            Show {calls.length - VISIBLE} more calls
          </summary>
          <ul className="divide-y border-t">{calls.slice(VISIBLE).map(row)}</ul>
        </details>
      )}
    </SectionCard>
  )
}
