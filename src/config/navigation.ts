import {
  CalendarDays,
  ChartColumn,
  DoorOpen,
  History,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Sparkles,
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
}

interface VenueNavEntry {
  label: string
  icon: LucideIcon
  href: (venueId: string) => string
  access: Partial<Record<VenueRole, NavAccess>>
}

// Who sees what inside a venue (plan 01). Showing an item is a courtesy; the API and RLS still decide.
const VENUE_NAV: VenueNavEntry[] = [
  { label: "Overview", icon: LayoutDashboard, href: ROUTES.venue, access: { owner: "edit", manager: "edit" } },
  { label: "Plan", icon: Sparkles, href: ROUTES.venuePlan, access: { owner: "edit", manager: "edit", door: "view" } },
  {
    label: "Series",
    icon: CalendarDays,
    href: ROUTES.venueSeries,
    access: { owner: "edit", manager: "edit", door: "view" },
  },
  { label: "Door", icon: DoorOpen, href: ROUTES.venueDoor, access: { owner: "edit", manager: "edit", door: "edit" } },
  { label: "Results", icon: ChartColumn, href: ROUTES.venueResults, access: { owner: "edit", manager: "edit" } },
  { label: "Team", icon: Users, href: ROUTES.venueTeam, access: { owner: "edit", manager: "view" } },
  { label: "Settings", icon: Settings, href: ROUTES.venueSettings, access: { owner: "edit", manager: "edit" } },
  { label: "History", icon: History, href: ROUTES.venueHistory, access: { owner: "edit", manager: "edit" } },
]

export function venueNavigation(venueId: string, role: VenueRole): NavItem[] {
  return VENUE_NAV.flatMap(({ label, icon, href, access }) => {
    const level = access[role]
    return level ? [{ label, icon, href: href(venueId), access: level }] : []
  })
}

export const ALL_VENUES_ITEM: NavItem = { label: "Your venues", icon: Store, href: ROUTES.venues, access: "edit" }

export const ADMIN_ITEM: NavItem = { label: "Admin", icon: ShieldCheck, href: ROUTES.admin, access: "edit" }

// The page a venue role lands on: door staff go straight to the door.
export function venueHome(venueId: string, role: VenueRole): string {
  return role === "door" ? ROUTES.venueDoor(venueId) : ROUTES.venue(venueId)
}
