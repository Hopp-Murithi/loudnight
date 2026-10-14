"use client"

import { Button } from "@/components/ui/button"
import { useStartRun } from "../hooks/use-run-queries"

export function StartRunButton({
  venueId,
  label,
  variant = "default",
}: {
  venueId: string
  label: string
  variant?: "default" | "outline"
}) {
  const start = useStartRun(venueId)
  return (
    <Button size="lg" variant={variant} onClick={() => start.mutate()} disabled={start.isPending || start.isSuccess}>
      {start.isPending || start.isSuccess ? "Starting" : label}
    </Button>
  )
}
