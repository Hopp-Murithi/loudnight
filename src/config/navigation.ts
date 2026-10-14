import {
  CalendarDays,
  ChartColumn,
  DoorOpen,
  History,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldCheck,
  Compass,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { Enums } from "@/types/database"
import { ROUTES } from "./site"

export type VenueRole = Enums<"venue_role">

export type NavAccess = "edit" | "view"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  access: NavAccess
  primary?: boolean
}

interface VenueNavEntry {
  label: string
  icon: LucideIcon
  href: (venueId: string) => string
  access: Partial<Record<VenueRole, NavAccess>>
  primary?: boolean
}

const EDITORS = { owner: "edit", manager: "edit" } as const

// Who sees what inside a venue (plan 01). Showing an item is a courtesy; the API and RLS still decide.
// Primary items are the journey itself, in order. The first four fill the tab bar on phones; the rest is upkeep.
const VENUE_NAV: VenueNavEntry[] = [
  { label: "Home", icon: LayoutDashboard, href: ROUTES.venue, access: EDITORS, primary: true },
  { label: "Plan", icon: Compass, href: ROUTES.venuePlan, access: { ...EDITORS, door: "view" }, primary: true },
  {
    label: "Series",
    icon: CalendarDays,
    href: ROUTES.venueSeries,
    access: { ...EDITORS, door: "view" },
    primary: true,
  },
  { label: "Promote", icon: Megaphone, href: ROUTES.venuePromote, access: EDITORS, primary: true },
  { label: "Door", icon: DoorOpen, href: ROUTES.venueDoor, access: { ...EDITORS, door: "edit" }, primary: true },
  { label: "Results", icon: ChartColumn, href: ROUTES.venueResults, access: { owner: "edit", manager: "edit" } },
  { label: "Team", icon: Users, href: ROUTES.venueTeam, access: { owner: "edit", manager: "view" } },
  { label: "Settings", icon: Settings, href: ROUTES.venueSettings, access: { owner: "edit", manager: "edit" } },
  { label: "History", icon: History, href: ROUTES.venueHistory, access: { owner: "edit", manager: "edit" } },
]

export function venueNavigation(venueId: string, role: VenueRole): NavItem[] {
  return VENUE_NAV.flatMap(({ label, icon, href, access, primary = false }) => {
    const level = access[role]
    return level ? [{ label, icon, href: href(venueId), access: level, primary }] : []
  })
}

// The venue being worked on comes from the address, so every page under /venues/[id] shares one frame.
export const venueIdFromPath = (pathname: string) => pathname.match(/^\/venues\/([0-9a-f-]{36})(?:\/|$)/)?.[1] ?? null

// An exact match for a section's home, a prefix match for everything below it.
export const isActivePath = (pathname: string, href: string, homes: string[]) =>
  homes.includes(href) ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

export const ALL_VENUES_ITEM: NavItem = { label: "Your venues", icon: Store, href: ROUTES.venues, access: "edit" }

export const ADMIN_ITEM: NavItem = { label: "Admin", icon: ShieldCheck, href: ROUTES.admin, access: "edit" }

// The page a venue role lands on: door staff go straight to the door.
export function venueHome(venueId: string, role: VenueRole): string {
  return role === "door" ? ROUTES.venueDoor(venueId) : ROUTES.venue(venueId)
}

// How many journey items fit beside More in the phone tab bar.
export const TAB_BAR_ITEMS = 4
