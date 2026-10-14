"use client"

import { Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { DoorGuest } from "../door.schemas"
import { formatClock } from "@/lib/format"

// The guest list by name, for a guest without their phone. Door staff see names and party sizes, never contacts.
export function GuestFinder({
  guests,
  onCheckIn,
  busy,
}: {
  guests: DoorGuest[]
  onCheckIn: (rsvpId: string) => void
  busy: boolean
}) {
  const [query, setQuery] = useState("")
  const needle = query.trim().toLowerCase()
  const shown = needle ? guests.filter((guest) => guest.name.toLowerCase().includes(needle)) : guests

  return (
    <div className="space-y-3">
      <Label htmlFor="door-search">Name on the list</Label>
      <Input
        id="door-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Start typing a name"
        autoComplete="off"
        className="h-12 text-base"
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {guests.length === 0 ? "Nobody has saved a place yet." : `${shown.length} of ${guests.length} on the list`}
      </p>
      <ul className="divide-y border">
        {shown.slice(0, 50).map((guest) => (
          <li key={guest.id} className="flex min-h-14 items-center justify-between gap-3 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate font-medium">{guest.name}</span>
              <span className="block text-sm text-muted-foreground">
                {guest.partySize === 1 ? "On their own" : `Party of ${guest.partySize}`}
              </span>
            </span>
            {guest.arrivedAt ? (
              <span className="flex shrink-0 items-center gap-1 text-sm text-success">
                <Check aria-hidden className="size-4" />
                In at {formatClock(guest.arrivedAt)}
              </span>
            ) : (
              <Button className="h-12 shrink-0 px-5" disabled={busy} onClick={() => onCheckIn(guest.id)}>
                Check in<span className="sr-only"> {guest.name}</span>
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
