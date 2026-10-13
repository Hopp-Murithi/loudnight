import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import type { ShellVenue } from "@/components/layout/app-sidebar"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { devToolsEnabled } from "@/config/dev"
import type { CurrentUser } from "@/modules/auth/types"

export const metadata: Metadata = { title: "Shell preview", robots: { index: false } }

const USER: CurrentUser = {
  id: "preview",
  displayName: "Ada",
  email: "ada@example.com",
  role: "owner",
  isAnonymous: false,
}

const VENUES: ShellVenue[] = [
  { id: "copper", name: "The Copper Room", role: "owner" },
  { id: "eastside", name: "Eastside Social", role: "door" },
]

// The signed-in frame with sample data, so the shell can be checked without a session. Development only.
export default async function ShellPreview({ searchParams }: PageProps<"/dev/components/shell">) {
  if (!devToolsEnabled()) notFound()
  const role = (await searchParams).role === "door" ? 1 : 0
  const venue = VENUES[role]

  return (
    <AppShell user={USER} defaultOpen venues={VENUES} currentVenueId={venue.id}>
      <PageHeader
        title={venue.name}
        description={`Previewing the shell as ${venue.role === "door" ? "door staff" : "the owner"}.`}
      />
      <EmptyState
        title="Feature pages arrive with their plans"
        description="This page only checks the frame, navigation and switcher."
      />
    </AppShell>
  )
}
