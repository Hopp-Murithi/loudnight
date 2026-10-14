import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { ADMIN_PAGE_SIZE } from "@/config/admin"
import { ROUTES } from "@/config/site"
import { AdminNav, AdminPager } from "@/modules/admin/components/admin-chrome"
import { adminListSchema } from "@/modules/admin/admin.schemas"
import { getPageContext } from "@/modules/auth/server/context"
import { HistoryTimeline } from "@/modules/history/components/history-timeline"
import { platformHistory } from "@/modules/history/history.service"

export const metadata: Metadata = { title: "Audit log: Admin" }

export default async function AdminAuditPage({ searchParams }: PageProps<"/admin/audit">) {
  const ctx = await getPageContext()
  const page = adminListSchema.parse(await searchParams).page ?? 1
  const entries = await platformHistory(ctx.supabase, ADMIN_PAGE_SIZE + 1, (page - 1) * ADMIN_PAGE_SIZE)
  return (
    <>
      <PageHeader
        title="Audit log"
        description="Who changed what, across every venue, newest first. It records which fields changed, never their contents. Times in UTC."
      />
      <AdminNav current={ROUTES.adminAudit} />
      <HistoryTimeline entries={entries.slice(0, ADMIN_PAGE_SIZE)} timeZone="UTC" />
      <AdminPager path={ROUTES.adminAudit} page={page} hasMore={entries.length > ADMIN_PAGE_SIZE} />
    </>
  )
}
