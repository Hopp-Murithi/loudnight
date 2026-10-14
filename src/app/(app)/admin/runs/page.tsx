import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/site"
import { adminRuns } from "@/modules/admin/admin.detail"
import { adminListSchema } from "@/modules/admin/admin.schemas"
import { AdminNav, AdminPager } from "@/modules/admin/components/admin-chrome"
import { RunsTable } from "@/modules/admin/components/runs-table"
import { getPageContext } from "@/modules/auth/server/context"

export const metadata: Metadata = { title: "Plans: Admin" }

export default async function AdminRunsPage({ searchParams }: PageProps<"/admin/runs">) {
  const ctx = await getPageContext()
  const query = adminListSchema.parse(await searchParams)
  const runs = await adminRuns(ctx, query)
  const failedOnly = query.status === "failed"
  return (
    <>
      <PageHeader
        title="Plans"
        description="Every plan Loudnight has made, newest first. A stopped plan picks up where it stopped when its owner opens it."
      />
      <AdminNav current={ROUTES.adminRuns} />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={failedOnly ? "outline" : "default"}
          nativeButton={false}
          render={<Link href={ROUTES.adminRuns} />}
        >
          All plans
        </Button>
        <Button
          size="sm"
          variant={failedOnly ? "default" : "outline"}
          nativeButton={false}
          render={<Link href={`${ROUTES.adminRuns}?status=failed`} />}
        >
          Only the ones that stopped
        </Button>
      </div>
      {runs.rows.length === 0 ? (
        <EmptyState
          title={failedOnly ? "No plans stopped" : "No plans yet"}
          description="Plans appear here as owners start them."
        />
      ) : (
        <RunsTable runs={runs.rows} />
      )}
      <AdminPager path={ROUTES.adminRuns} page={runs.page} hasMore={runs.hasMore} />
    </>
  )
}
