"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Ban, CircleCheck } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { SubmitButton } from "@/components/forms/submit-button"
import { TextAreaField } from "@/components/forms/text-area-field"
import { ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/site"
import { VENUE_TYPE_LABELS, type VenueType } from "@/config/venues"
import { suspendVenueSchema, type AdminVenue, type SuspendVenueInput } from "../admin.schemas"
import { useLiftVenue, useSuspendVenue } from "../hooks/use-admin"

// One venue in the console: where it is, whether it is suspended and why, and the one action that fits.
export function VenueAdminRow({ venue }: { venue: AdminVenue }) {
  const [asking, setAsking] = useState(false)
  const suspend = useSuspendVenue(venue.id)
  const lift = useLiftVenue(venue.id)
  const form = useForm<SuspendVenueInput>({ resolver: zodResolver(suspendVenueSchema), defaultValues: { reason: "" } })
  const suspended = venue.suspendedAt !== null

  return (
    <li className="space-y-3 border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link
            href={ROUTES.venue(venue.id)}
            className="font-medium break-words text-link underline-offset-4 hover:underline"
          >
            {venue.name}
          </Link>
          <p className="text-sm text-muted-foreground">
            {VENUE_TYPE_LABELS[venue.venueType as VenueType] ?? "Venue"} in {venue.place}
            {venue.isDemo && ", demo"}
          </p>
        </div>
        {suspended ? (
          <ToneBadge tone="danger" icon={Ban} label="Suspended" />
        ) : (
          <ToneBadge tone="success" icon={CircleCheck} label="Active" />
        )}
      </div>
      {suspended && <p className="text-sm">Why: {venue.suspendedReason}</p>}
      {suspended ? (
        <Button variant="outline" size="sm" disabled={lift.isPending} onClick={() => lift.mutate(undefined)}>
          {lift.isPending ? "Lifting" : "Lift the suspension"}
        </Button>
      ) : asking ? (
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
            <SubmitButton size="sm" variant="destructive" pending={suspend.isPending} pendingLabel="Suspending">
              Suspend {venue.name}
            </SubmitButton>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAsking(false)}>
              Keep it open
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAsking(true)}>
          Suspend
        </Button>
      )}
    </li>
  )
}
