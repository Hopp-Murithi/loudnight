"use client"

import { RotateCw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  title: string
  description: string
  onRetry?: () => void
  retryLabel?: string
}

// Says what failed and what to do next. Never apologises, never hides the way forward.
export function ErrorState({ title, description, onRetry, retryLabel = "Try again" }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 border border-destructive/30 bg-destructive/5 p-5">
      <div className="flex items-center gap-2 text-destructive">
        <TriangleAlert className="size-4 shrink-0" aria-hidden />
        <p className="font-medium">{title}</p>
      </div>
      <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden />
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
