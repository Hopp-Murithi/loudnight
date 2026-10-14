"use client"

import { Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"
import { isActivePath, TAB_BAR_ITEMS, venueIdFromPath, venueNavigation } from "@/config/navigation"
import { ROUTES } from "@/config/site"
import { cn } from "@/lib/utils"
import type { ShellVenue } from "./app-sidebar"

const TAB = "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[0.7rem] outline-none"
const MARK = "h-0.5 w-8 -translate-y-1.5"

// On a phone the venue's journey sits under the thumb, like any app. Everything else is one tap away in More.
export function MobileTabBar({ venues, currentVenueId }: { venues: ShellVenue[]; currentVenueId?: string }) {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()
  const venue = venues.find((item) => item.id === (currentVenueId ?? venueIdFromPath(pathname)))
  if (!venue) return null
  const tabs = venueNavigation(venue.id, venue.role)
    .filter((item) => item.primary)
    .slice(0, TAB_BAR_ITEMS)
  const homes = [ROUTES.venue(venue.id)]

  return (
    <nav
      aria-label={venue.name}
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="flex">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = isActivePath(pathname, href, homes)
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  TAB,
                  "focus-visible:bg-muted",
                  active ? "font-medium text-primary" : "text-muted-foreground",
                )}
              >
                <span aria-hidden className={cn(MARK, active ? "bg-primary" : "bg-transparent")} />
                <Icon aria-hidden className="size-5" />
                {label}
              </Link>
            </li>
          )
        })}
        <li className="flex flex-1">
          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(TAB, "text-muted-foreground focus-visible:bg-muted")}
          >
            <span aria-hidden className={MARK} />
            <Menu aria-hidden className="size-5" />
            More
          </button>
        </li>
      </ul>
    </nav>
  )
}
