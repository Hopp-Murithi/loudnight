import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { ROUTES } from "@/config/site"
import { AdminNav, AdminPager, AdminSearch } from "@/modules/admin/components/admin-chrome"
import { PersonAdminRow } from "@/modules/admin/components/person-admin-row"
import { adminListSchema } from "@/modules/admin/admin.schemas"
import { adminPeople } from "@/modules/admin/admin.service"
import { getPageContext } from "@/modules/auth/server/context"

export const metadata: Metadata = { title: "People: Admin" }

export default async function AdminPeoplePage({ searchParams }: PageProps<"/admin/people">) {
  const ctx = await getPageContext()
  const query = adminListSchema.parse(await searchParams)
  const people = await adminPeople(ctx.supabase, query)
  return (
    <>
      <PageHeader title="People" description="Everyone with a Loudnight session, newest first." />
      <AdminNav current={ROUTES.adminPeople} />
      <AdminSearch label="Search by name or email" value={query.q} />
      {people.rows.length === 0 ? (
        <EmptyState title="Nobody matches" description="Try another name or email." />
      ) : (
        <ul className="grid gap-3">
          {people.rows.map((person) => (
            <PersonAdminRow key={person.id} person={person} isMe={person.id === ctx.user.id} />
          ))}
        </ul>
      )}
      <AdminPager path={ROUTES.adminPeople} q={query.q} page={people.page} hasMore={people.hasMore} />
    </>
  )
}
