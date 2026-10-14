"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { SubmitButton } from "@/components/forms/submit-button"
import { TextAreaField } from "@/components/forms/text-area-field"
import { Button } from "@/components/ui/button"
import { suspendVenueSchema, type AdminVenue, type SuspendVenueInput } from "../admin.schemas"
import { useLiftVenue, useSuspendVenue } from "../hooks/use-admin"

// Suspend with a reason that says what happens, or lift. The database enforces both.
export function VenueSuspension({
  venue,
}: {
  venue: Pick<AdminVenue, "id" | "name" | "suspendedAt" | "suspendedReason">
}) {
  const [asking, setAsking] = useState(false)
  const suspend = useSuspendVenue(venue.id)
  const lift = useLiftVenue(venue.id)
  const form = useForm<SuspendVenueInput>({ resolver: zodResolver(suspendVenueSchema), defaultValues: { reason: "" } })

  if (venue.suspendedAt)
    return (
      <div className="space-y-3">
        <p className="border-l-2 border-destructive bg-destructive/10 p-3 text-sm">Why: {venue.suspendedReason}</p>
        <Button variant="outline" disabled={lift.isPending} onClick={() => lift.mutate(undefined)}>
          {lift.isPending ? "Lifting" : "Lift the suspension"}
        </Button>
      </div>
    )

  if (!asking)
    return (
      <Button variant="outline" onClick={() => setAsking(true)}>
        Suspend this venue
      </Button>
    )

  return (
    <form
      className="space-y-3"
      onSubmit={form.handleSubmit((input) => suspend.mutate(input, { onSuccess: () => setAsking(false) }))}
    >
      <TextAreaField
        control={form.control}
        name="reason"
        label="Why suspend it?"
        description="The team keeps read access but cannot change anything, and guests cannot book, until you lift it."
        rows={2}
      />
      <div className="flex flex-wrap gap-2">
        <SubmitButton variant="destructive" pending={suspend.isPending} pendingLabel="Suspending">
          Suspend {venue.name}
        </SubmitButton>
        <Button type="button" variant="ghost" onClick={() => setAsking(false)}>
          Keep it open
        </Button>
      </div>
    </form>
  )
}
