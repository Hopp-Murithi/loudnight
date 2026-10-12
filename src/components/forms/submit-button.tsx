"use client"

import type { ComponentProps } from "react"
import { Spinner } from "@/components/shared/spinner"
import { Button } from "@/components/ui/button"

interface SubmitButtonProps extends ComponentProps<typeof Button> {
  pending: boolean
  pendingLabel: string
}

// Announces progress to screen readers and blocks double submits.
export function SubmitButton({
  pending,
  pendingLabel,
  children,
  disabled,
  type = "submit",
  ...props
}: SubmitButtonProps) {
  return (
    <Button type={type} disabled={pending || disabled} aria-live="polite" {...props}>
      {pending ? (
        <>
          <Spinner />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
