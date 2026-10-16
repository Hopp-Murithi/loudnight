"use client"

import { Ticket } from "lucide-react"
import { useState } from "react"
import { StickyActionBar } from "@/components/shared/sticky-action-bar"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/site"
import { TYPE } from "@/lib/typography"
import { useSavedTicket } from "../hooks/use-saved-ticket"
import { RsvpForm } from "./rsvp-form"

// Where a guest saves a place. A guest who already has a ticket on this phone is shown it, not asked again.
export function ReserveSection({ slug, venueName }: { slug: string; venueName: string }) {
  const ticket = useSavedTicket(slug)
  const [another, setAnother] = useState(false)

  if (ticket && !another)
    return (
      <section aria-labelledby="rsvp-heading" className="space-y-3 border bg-card p-5 sm:p-6">
        <h2 id="rsvp-heading" className={TYPE.h2}>
          You have a place
        </h2>
        <p className="text-sm text-muted-foreground">
          Show your ticket at the door. It lets your whole party in once, on the night.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" nativeButton={false} render={<a href={ROUTES.ticket(slug, ticket)} />}>
            <Ticket aria-hidden className="size-4" />
            Show my ticket
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setAnother(true)}>
            Reserve for someone else
          </Button>
        </div>
      </section>
    )

  return (
    <>
      <section aria-labelledby="rsvp-heading" className="space-y-4 border bg-card p-5 sm:p-6">
        <h2 id="rsvp-heading" className={TYPE.h2}>
          Save your place
        </h2>
        <RsvpForm slug={slug} venueName={venueName} />
      </section>
      <StickyActionBar className="md:hidden">
        <Button size="lg" className="w-full" nativeButton={false} render={<a href="#rsvp-heading" />}>
          Save my place
        </Button>
      </StickyActionBar>
    </>
  )
}
