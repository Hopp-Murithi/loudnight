import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { ROUTES } from "@/config/site"
import { AdminNav, AdminPager, AdminSearch } from "@/modules/admin/components/admin-chrome"
import { VenueAdminRow } from "@/modules/admin/components/venue-admin-row"
import { adminListSchema } from "@/modules/admin/admin.schemas"
import { adminVenues } from "@/modules/admin/admin.service"
import { getPageContext } from "@/modules/auth/server/context"

export const metadata: Metadata = { title: "Venues: Admin" }

export default async function AdminVenuesPage({ searchParams }: PageProps<"/admin/venues">) {
  const ctx = await getPageContext()
  const query = adminListSchema.parse(await searchParams)
  const venues = await adminVenues(ctx.supabase, query)
  return (
    <>
      <PageHeader
        title="Venues"
        description="Every venue, newest first. Suspend one to freeze it while you look into it."
      />
      <AdminNav current={ROUTES.adminVenues} />
      <AdminSearch label="Search by venue or town" value={query.q} />
      {venues.rows.length === 0 ? (
        <EmptyState title="No venues match" description="Try another name or town." />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {venues.rows.map((venue) => (
            <VenueAdminRow key={venue.id} venue={venue} />
          ))}
        </ul>
      )}
      <AdminPager path={ROUTES.adminVenues} q={query.q} page={venues.page} hasMore={venues.hasMore} />
    </>
  )
}
