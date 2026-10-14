"use client"

import { Button } from "@/components/ui/button"
import type { Weekday } from "@/config/venues"
import { useStartRun } from "../hooks/use-run-queries"

export function StartRunButton({
  venueId,
  weekday,
  label,
  variant = "default",
}: {
  venueId: string
  weekday: Weekday
  label: string
  variant?: "default" | "outline"
}) {
  const start = useStartRun(venueId, weekday)
  return (
    <Button size="lg" variant={variant} onClick={() => start.mutate()} disabled={start.isPending || start.isSuccess}>
      {start.isPending || start.isSuccess ? "Starting" : label}
    </Button>
  )
}
