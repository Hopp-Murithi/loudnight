"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
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
import { ADMIN_ITEM, ALL_VENUES_ITEM, venueNavigation, type NavItem, type VenueRole } from "@/config/navigation"
import { ROUTES } from "@/config/site"
import { Brand } from "./brand"

export interface ShellVenue {
  id: string
  name: string
  role: VenueRole
}

interface AppSidebarProps {
  venue: ShellVenue | null
  isAdministrator: boolean
  venueSwitcher?: ReactNode
}

// An exact match for a section's home, a prefix match for everything below it.
const activeFor = (pathname: string, href: string, homes: string[]) =>
  homes.includes(href) ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

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
                isActive={activeFor(pathname, href, homes)}
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

export function AppSidebar({ venue, isAdministrator, venueSwitcher }: AppSidebarProps) {
  const pathname = usePathname()
  const venueItems = venue ? venueNavigation(venue.id, venue.role) : []
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
        {venueSwitcher && <div className="group-data-[collapsible=icon]:hidden">{venueSwitcher}</div>}
      </SidebarHeader>
      <SidebarContent className="px-2">
        {venue && <NavGroup label={venue.name} items={venueItems} pathname={pathname} homes={homes} />}
        <NavGroup label="Encore" items={general} pathname={pathname} homes={homes} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
