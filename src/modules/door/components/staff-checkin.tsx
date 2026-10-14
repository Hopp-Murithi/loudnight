"use client"

import { CircleAlert, CircleCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/http/client"
import { formatClock } from "@/lib/format"
import { useCheckIn } from "../hooks/use-door"

interface StaffCheckInProps {
  nightId: string
  code: string
  name: string
  partySize: number
  arrivedAt: string | null
  timeZone: string
}

// Shown on a ticket only to the venue's own team: one tap lets the guest in, and a second scan says when they came.
export function StaffCheckIn({ nightId, code, name, partySize, arrivedAt, timeZone }: StaffCheckInProps) {
  const checkIn = useCheckIn(nightId)
  const result = checkIn.data
  const firstIn = result?.at ?? arrivedAt
  const who = partySize > 1 ? `${name}, party of ${partySize}` : name

  return (
    <section aria-label="Door" className="space-y-3 border-2 border-primary bg-card p-5 text-left">
      <p className="text-sm text-muted-foreground">You are on this venue&apos;s team</p>
      <p className="text-xl font-semibold">{who}</p>
      {firstIn ? (
        <p role="status" className="flex items-center gap-2 text-lg">
          {result?.status === "in" ? (
            <CircleCheck aria-hidden className="size-6 text-success" />
          ) : (
            <CircleAlert aria-hidden className="size-6 text-warning" />
          )}
          {result?.status === "in"
            ? "Checked in. Enjoy the night."
            : `Already came in at ${formatClock(firstIn, timeZone)}`}
        </p>
      ) : (
        <Button
          size="lg"
          className="h-14 w-full text-lg"
          disabled={checkIn.isPending}
          onClick={() => checkIn.mutate({ code })}
        >
          {checkIn.isPending ? "Checking in" : "Check in"}
        </Button>
      )}
      {checkIn.error && (
        <p role="alert" className="text-sm text-destructive">
          {checkIn.error instanceof ApiError ? checkIn.error.message : "That did not go through. Try again."}
        </p>
      )}
    </section>
  )
}
