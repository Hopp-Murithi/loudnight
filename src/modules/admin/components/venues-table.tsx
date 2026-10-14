"use client"

import { ChevronRight } from "lucide-react"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VENUE_TYPE_LABELS, type VenueType } from "@/config/venues"
import type { AdminVenue } from "../admin.schemas"
import { Initials, VenueStatus } from "./admin-badges"
import { VenueSheet } from "./venue-sheet"

const added = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso))
const kind = (venue: AdminVenue) =>
  `${VENUE_TYPE_LABELS[venue.venueType as VenueType] ?? "Venue"}${venue.isDemo ? ", demo" : ""}`

// Every venue as a table on wider screens and as cards on a phone; a row opens its details beside the list.
export function VenuesTable({ venues }: { venues: AdminVenue[] }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <>
      <div className="hidden border bg-card md:block">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/70 backdrop-blur">
            <TableRow>
              <TableHead>Venue</TableHead>
              <TableHead>Where</TableHead>
              <TableHead>Added</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Details</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {venues.map((venue) => (
              <TableRow
                key={venue.id}
                onClick={() => setOpen(venue.id)}
                className="cursor-pointer transition-colors hover:bg-primary/5 data-[suspended=true]:bg-destructive/5"
                data-suspended={venue.suspendedAt !== null}
              >
                <TableCell>
                  <button
                    type="button"
                    className="flex items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Initials name={venue.name} />
                    <span>
                      <span className="block font-medium">{venue.name}</span>
                      <span className="block text-xs text-muted-foreground">{kind(venue)}</span>
                    </span>
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground">{venue.place}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{added(venue.createdAt)}</TableCell>
                <TableCell>
                  <VenueStatus suspended={venue.suspendedAt !== null} />
                </TableCell>
                <TableCell>
                  <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="grid gap-2 md:hidden">
        {venues.map((venue) => (
          <li key={venue.id}>
            <button
              type="button"
              onClick={() => setOpen(venue.id)}
              className="flex w-full items-center gap-3 border bg-card p-3 text-left outline-none hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Initials name={venue.name} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium break-words">{venue.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {kind(venue)} in {venue.place}
                </span>
                <span className="mt-2 block">
                  <VenueStatus suspended={venue.suspendedAt !== null} />
                </span>
              </span>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
      <VenueSheet venueId={open} onClose={() => setOpen(null)} />
    </>
  )
}
