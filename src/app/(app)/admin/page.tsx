import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { ROUTES } from "@/config/site"
import { AdminNav } from "@/modules/admin/components/admin-chrome"
import { AdminOverviewCards } from "@/modules/admin/components/admin-overview"
import { adminOverview } from "@/modules/admin/admin.service"
import { getPageContext } from "@/modules/auth/server/context"
import { HistoryTimeline } from "@/modules/history/components/history-timeline"
import { platformHistory } from "@/modules/history/history.service"

export const metadata: Metadata = { title: "Admin" }

export default async function AdminPage() {
  const ctx = await getPageContext()
  const [overview, latest] = await Promise.all([adminOverview(ctx.supabase), platformHistory(ctx.supabase, 8, 0)])
  return (
    <>
      <PageHeader title="Admin" description="Every venue and person on Loudnight, and what changed." />
      <AdminNav current={ROUTES.admin} />
      <AdminOverviewCards overview={overview} />
      <SectionCard title="Latest changes" description="Across every venue, newest first. Times in UTC.">
        <HistoryTimeline entries={latest} timeZone="UTC" />
      </SectionCard>
    </>
  )
}
