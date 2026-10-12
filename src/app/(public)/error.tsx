"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      title="This page did not load"
      description="Something went wrong on our side. Nothing you entered was lost. Try again in a moment."
      onRetry={reset}
    />
  )
}
