"use client"

import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

const MAX_PARTY = 10

// How many people, with big targets for a thumb at a busy door.
export function PartyStepper({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (next: number) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        className="size-12"
        aria-label="One fewer"
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus aria-hidden className="size-5" />
      </Button>
      <output aria-live="polite" className="min-w-16 text-center font-display text-5xl font-bold tabular-nums">
        {value}
      </output>
      <Button
        variant="outline"
        className="size-12"
        aria-label="One more"
        disabled={value >= MAX_PARTY}
        onClick={() => onChange(Math.min(MAX_PARTY, value + 1))}
      >
        <Plus aria-hidden className="size-5" />
      </Button>
    </div>
  )
}
