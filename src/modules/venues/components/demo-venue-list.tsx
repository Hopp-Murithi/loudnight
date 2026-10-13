import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { ROUTES } from "@/config/site"
import { cityOf } from "@/lib/address"
import type { DemoVenue } from "../venues.schemas"

// Real neighbourhoods a visitor can open without an account, as one quiet row of links.
export function DemoVenueList({ venues }: { venues: DemoVenue[] }) {
  const ready = venues.filter((venue) => venue.planReady)
  if (ready.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-2">
      {ready.map((venue) => {
        const city = cityOf(venue.address)
        return (
          <li key={venue.id} className="min-w-0">
            <Link
              href={ROUTES.demo(venue.id)}
              className="group inline-flex min-h-9 items-center gap-2 border px-3 py-1.5 text-sm outline-none hover:border-spotlight focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="font-medium">{venue.name}</span>
              {city && <span className="text-muted-foreground">{city}</span>}
              <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
