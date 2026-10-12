import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"

export const metadata: Metadata = { title: "Admin" }

// The frame for plan 08's console.
export default function AdminPage() {
  return (
    <>
      <PageHeader title="Admin" description="Venues, people, runs and the audit log." />
      <EmptyState title="Nothing to review yet" description="Venues, people and runs will appear here." />
    </>
  )
}
