import type { ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ROLES } from "@/config/roles"
import type { CurrentUser } from "@/modules/auth/types"
import { AccountMenu } from "./account-menu"
import { AppSidebar, type ShellVenue } from "./app-sidebar"
import { Brand } from "./brand"
import { SidebarToggle } from "./sidebar-toggle"
import { SkipLink } from "./skip-link"
import { ThemeToggle } from "./theme-toggle"

interface AppShellProps {
  user: CurrentUser
  defaultOpen: boolean
  venues: ShellVenue[]
  currentVenueId?: string
  children: ReactNode
}

// The signed-in frame: a drawer on phones, an icon rail on tablets, a full sidebar from laptop width.
export function AppShell({ user, defaultOpen, venues, currentVenueId, children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <SkipLink />
      <AppSidebar venues={venues} isAdministrator={user.role === ROLES.administrator} currentVenueId={currentVenueId} />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur sm:px-4">
          <SidebarToggle />
          <Brand nameClassName="text-xl" className="md:hidden" />
          <div className="ml-auto flex items-center gap-0.5">
            <ThemeToggle />
            <AccountMenu user={user} />
          </div>
        </header>
        <main
          id="content"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-4 outline-none sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
