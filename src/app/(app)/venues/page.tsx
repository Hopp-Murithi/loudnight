import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"

export const metadata: Metadata = { title: "Your venues" }

// The frame for plan 03, which fills it with the venue list and onboarding.
export default function VenuesPage() {
  return (
    <>
      <PageHeader title="Your venues" description="The venues you plan nights for." />
      <EmptyState title="No venues yet" description="Venues you add will appear here." />
    </>
  )
}
