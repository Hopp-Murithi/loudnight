"use client"

import { Sparkles } from "lucide-react"
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
      <Sparkles aria-hidden className="size-4" />
      {start.isPending || start.isSuccess ? "Starting" : label}
    </Button>
  )
}
