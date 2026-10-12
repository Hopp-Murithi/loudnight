"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      title="This page did not load"
      description="Your venues and plans are safe. Try again, or open another page from the menu."
      onRetry={reset}
    />
  )
}
