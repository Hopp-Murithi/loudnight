"use client"

import { Check, ChevronsUpDown, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { venueHome } from "@/config/navigation"
import { ROUTES } from "@/config/site"
import type { ShellVenue } from "./app-sidebar"

interface VenueSwitcherProps {
  venues: ShellVenue[]
  currentId: string | null
}

// Shows the venue being worked on and moves between the venues this person belongs to. Plan 03 supplies the list.
export function VenueSwitcher({ venues, currentId }: VenueSwitcherProps) {
  const current = venues.find((venue) => venue.id === currentId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="h-10 w-full justify-between border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
          />
        }
      >
        <span className="min-w-0 truncate">{current?.name ?? "Choose a venue"}</span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Your venues</DropdownMenuLabel>
          {venues.map((venue) => (
            <DropdownMenuItem key={venue.id} render={<Link href={venueHome(venue.id, venue.role)} />}>
              <span className="min-w-0 flex-1 truncate">{venue.name}</span>
              {venue.id === currentId && <Check className="size-4" aria-label="Current venue" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={ROUTES.newVenue} />}>
          <Plus className="size-4" aria-hidden />
          Add a venue
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
