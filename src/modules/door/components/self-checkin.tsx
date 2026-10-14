"use client"

import { CircleCheck } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/http/client"
import { useSelfCheckIn } from "../hooks/use-self-checkin"
import { PartyStepper } from "./party-stepper"

// "I'm here", from the QR on the door: how many of you, one tap, and you are counted.
export function SelfCheckIn({ slug, venueName }: { slug: string; venueName: string }) {
  const [party, setParty] = useState(1)
  const { here, done } = useSelfCheckIn(slug)

  if (done)
    return (
      <div role="status" className="space-y-3 border-l-4 border-success bg-success/12 p-6 text-left">
        <CircleCheck aria-hidden className="size-8 text-success" />
        <p className="text-2xl font-semibold">You&apos;re in. Enjoy the night.</p>
        <p className="text-sm text-muted-foreground">{venueName} knows you came. Nothing else to do.</p>
      </div>
    )

  return (
    <div className="space-y-6">
      <PartyStepper value={party} onChange={setParty} label="How many of you" />
      <p className="text-sm text-muted-foreground">How many of you are coming in together?</p>
      <Button size="lg" className="h-14 w-full text-lg" disabled={here.isPending} onClick={() => here.mutate(party)}>
        {here.isPending ? "Counting you in" : "I'm here"}
      </Button>
      {here.error && (
        <p role="alert" className="text-sm text-destructive">
          {here.error instanceof ApiError ? here.error.message : "That did not go through. Try again."}
        </p>
      )}
    </div>
  )
}
