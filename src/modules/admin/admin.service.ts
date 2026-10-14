import "server-only"
import { ADMIN_PAGE_SIZE } from "@/config/admin"
import { ROLES } from "@/config/roles"
import { conflict, notFound } from "@/lib/http/errors"
import { createAdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { RequestContext } from "@/modules/auth/types"
import { setSignInBlocked } from "@/modules/auth/server/identity"
import { historyRepository } from "@/modules/history/history.repository"
import { adminRepository, searchTerm } from "./admin.repository"
import type { AdminListQuery, AdminOverview, AdminPage, AdminPerson, AdminVenue } from "./admin.schemas"

const pageOf = <T>(rows: T[], page: number): AdminPage<T> => ({
  rows: rows.slice(0, ADMIN_PAGE_SIZE),
  page,
  hasMore: rows.length > ADMIN_PAGE_SIZE,
})

const startOfToday = (now: Date) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()

// What an operator checks first: how many venues and people, how planning went today, and what guests did today.
export async function adminOverview(supabase: ServerSupabase, now = new Date()): Promise<AdminOverview> {
  const counts = await adminRepository.counts(supabase, startOfToday(now))
  return {
    venues: counts.venues,
    suspendedVenues: counts.suspended,
    people: counts.people,
    peopleWithEmail: counts.withEmail,
    plansToday: counts.plans,
    failedPlansToday: counts.failed,
    publishedNights: counts.published,
    rsvpsToday: counts.rsvps,
    checkinsToday: counts.checkins,
  }
}

export async function adminVenues(supabase: ServerSupabase, query: AdminListQuery): Promise<AdminPage<AdminVenue>> {
  const page = query.page ?? 1
  const rows = await adminRepository.venues(supabase, searchTerm(query.q), page)
  return pageOf(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      place: [row.city, row.country_code].filter(Boolean).join(", ") || row.address,
      venueType: row.venue_type,
      isDemo: row.is_demo,
      createdAt: row.created_at,
      suspendedAt: row.suspended_at,
      suspendedReason: row.suspended_reason,
    })),
    page,
  )
}

export async function adminPeople(supabase: ServerSupabase, query: AdminListQuery): Promise<AdminPage<AdminPerson>> {
  const page = query.page ?? 1
  const rows = await adminRepository.people(supabase, searchTerm(query.q), page)
  return pageOf(
    rows.map((row) => ({
      id: row.id,
      name: row.display_name ?? row.email ?? "Guest visitor",
      email: row.email,
      role: row.role,
      isAnonymous: row.is_anonymous,
      isActive: row.is_active,
      createdAt: row.created_at,
    })),
    page,
  )
}

export const adminService = {
  // The database refuses this to anyone but an administrator, and audits it.
  async suspendVenue(ctx: RequestContext, venueId: string, reason: string) {
    if (!(await adminRepository.setSuspension(ctx.supabase, venueId, reason)))
      throw notFound("That venue does not exist.")
    return { suspended: true }
  },

  async liftVenue(ctx: RequestContext, venueId: string) {
    if (!(await adminRepository.setSuspension(ctx.supabase, venueId, null)))
      throw notFound("That venue does not exist.")
    return { suspended: false }
  },

  // Deactivating stops the person reading anything at once (RLS ignores inactive people) and blocks sign-in.
  async setPersonActive(ctx: RequestContext, personId: string, active: boolean) {
    if (personId === ctx.user.id) throw conflict("You cannot deactivate yourself.")
    const person = await adminRepository.findPerson(ctx.supabase, personId)
    if (!person) throw notFound("That person does not exist.")
    if (person.role === ROLES.administrator) throw conflict("Administrators cannot be deactivated from here.")
    // Sign-in first: if the auth service refuses, nothing has changed.
    await setSignInBlocked(personId, !active)
    const admin = createAdminSupabase()
    await adminRepository.setActive(admin, personId, active)
    await historyRepository.record(admin, {
      actorId: ctx.user.id,
      action: active ? "person.reactivated" : "person.deactivated",
      subjectType: "profiles",
      subjectId: personId,
    })
    return { active }
  },
}
