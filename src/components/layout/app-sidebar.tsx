"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  ADMIN_ITEM,
  ALL_VENUES_ITEM,
  isActivePath,
  venueIdFromPath,
  venueNavigation,
  type NavItem,
  type VenueRole,
} from "@/config/navigation"
import { ROUTES } from "@/config/site"
import { Brand } from "./brand"
import { VenueSwitcher } from "./venue-switcher"

export interface ShellVenue {
  id: string
  name: string
  role: VenueRole
}

interface AppSidebarProps {
  venues: ShellVenue[]
  isAdministrator: boolean
  currentVenueId?: string
}

function NavGroup({
  label,
  items,
  pathname,
  homes,
}: {
  label: string
  items: NavItem[]
  pathname: string
  homes: string[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(({ label: itemLabel, href, icon: Icon, access }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton
                isActive={isActivePath(pathname, href, homes)}
                tooltip={access === "view" ? `${itemLabel} (view only)` : itemLabel}
                className="h-9 font-normal data-active:bg-sidebar-accent data-active:font-medium data-active:[&_svg]:text-sidebar-primary"
                render={<Link href={href} />}
              >
                <Icon aria-hidden />
                <span>{itemLabel}</span>
                {access === "view" && <span className="ml-auto text-xs text-sidebar-foreground/60">View</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar({ venues, isAdministrator, currentVenueId: override }: AppSidebarProps) {
  const pathname = usePathname()
  const currentId = override ?? venueIdFromPath(pathname)
  const venue = venues.find((item) => item.id === currentId) ?? null
  const venueItems = venue ? venueNavigation(venue.id, venue.role) : []
  const journey = venueItems.filter((item) => item.primary)
  const upkeep = venueItems.filter((item) => !item.primary)
  const homes = [ROUTES.venues, ROUTES.admin, ...(venue ? [ROUTES.venue(venue.id)] : [])]
  const general = isAdministrator ? [ALL_VENUES_ITEM, ADMIN_ITEM] : [ALL_VENUES_ITEM]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 px-3 py-4">
        <Brand
          href={ROUTES.venues}
          className="text-sidebar-foreground focus-visible:ring-sidebar-ring focus-visible:ring-offset-sidebar"
          nameClassName="group-data-[collapsible=icon]:hidden"
        />
        {venues.length > 0 && (
          <div className="group-data-[collapsible=icon]:hidden">
            <VenueSwitcher venues={venues} currentId={venue?.id ?? null} />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="px-2">
        {venue && <NavGroup label={venue.name} items={journey} pathname={pathname} homes={homes} />}
        {upkeep.length > 0 && <NavGroup label="Manage" items={upkeep} pathname={pathname} homes={homes} />}
        <NavGroup label="Loudnight" items={general} pathname={pathname} homes={homes} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
