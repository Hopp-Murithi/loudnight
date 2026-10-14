import "server-only"
import { notFound } from "@/lib/http/errors"
import type { RequestContext } from "@/modules/auth/types"
import { signInStatuses, type SignInStatus } from "@/modules/auth/server/identity"
import { adminDetailRepository } from "./admin-detail.repository"
import { ADMIN_PAGE_SIZE } from "@/config/admin"
import type {
  AdminListQuery,
  AdminPage,
  AdminPersonDetail,
  AdminRun,
  AdminVenueDetail,
  SignInState,
} from "./admin.schemas"

const one = <T>(value: T | T[] | null): T | null => (Array.isArray(value) ? (value[0] ?? null) : value)

// An invited person who never signed in has not joined; a guest has no email yet.
export function signInState(isAnonymous: boolean, status: SignInStatus | undefined): SignInState {
  if (isAnonymous) return "guest"
  if (status?.lastSignInAt) return "joined"
  return status?.invitedAt ? "invited" : "not_signed_in"
}

export async function adminVenueDetail(ctx: RequestContext, venueId: string): Promise<AdminVenueDetail> {
  const [venue, team, settings, activity] = await Promise.all([
    adminDetailRepository.venue(ctx.supabase, venueId),
    adminDetailRepository.team(ctx.supabase, venueId),
    adminDetailRepository.settings(ctx.supabase, venueId),
    adminDetailRepository.activity(ctx.supabase, venueId),
  ])
  if (!venue) throw notFound("That venue does not exist.")
  const statuses = await signInStatuses(team.map((member) => member.user_id))
  return {
    venue: {
      id: venue.id,
      name: venue.name,
      place: venue.city ? [venue.city, venue.country_code].filter(Boolean).join(", ") : venue.address,
      venueType: venue.venue_type,
      isDemo: venue.is_demo,
      createdAt: venue.created_at,
      suspendedAt: venue.suspended_at,
      suspendedReason: venue.suspended_reason,
      currency: venue.currency,
      timeZone: venue.time_zone,
    },
    team: team.map((member) => {
      const profile = one(member.profile)
      return {
        id: member.user_id,
        name: profile?.display_name ?? profile?.email ?? "Guest visitor",
        email: profile?.email ?? null,
        role: member.role,
        state: signInState(profile?.is_anonymous ?? false, statuses.get(member.user_id)),
      }
    }),
    settings: settings && {
      quietNights: settings.quiet_nights,
      capacity: settings.capacity,
      breakEven: settings.break_even_headcount,
      talentBudgetCents: settings.talent_budget_cents,
    },
    activity: {
      plans: activity.plans,
      lastPlanAt: activity.lastPlanAt,
      publishedNights: activity.published,
      rsvps: activity.rsvps,
      checkins: activity.checkins,
    },
  }
}

export async function adminPersonDetail(ctx: RequestContext, personId: string): Promise<AdminPersonDetail> {
  const [person, memberships, statuses] = await Promise.all([
    adminDetailRepository.person(ctx.supabase, personId),
    adminDetailRepository.memberships(ctx.supabase, personId),
    signInStatuses([personId]),
  ])
  if (!person) throw notFound("That person does not exist.")
  const status = statuses.get(personId)
  return {
    person: {
      id: person.id,
      name: person.display_name ?? person.email ?? "Guest visitor",
      email: person.email,
      role: person.role,
      isAnonymous: person.is_anonymous,
      isActive: person.is_active,
      createdAt: person.created_at,
    },
    state: signInState(person.is_anonymous, status),
    lastSignInAt: status?.lastSignInAt ?? null,
    venues: memberships.flatMap((membership) => {
      const venue = one(membership.venue)
      return venue ? [{ id: venue.id, name: venue.name, role: membership.role }] : []
    }),
  }
}

// Every plan made on Loudnight, newest first, or only the ones that stopped part way.
export async function adminRuns(ctx: RequestContext, query: AdminListQuery): Promise<AdminPage<AdminRun>> {
  const page = query.page ?? 1
  const from = (page - 1) * ADMIN_PAGE_SIZE
  const rows = await adminDetailRepository.runs(ctx.supabase, query.status === "failed", from, from + ADMIN_PAGE_SIZE)
  return {
    page,
    hasMore: rows.length > ADMIN_PAGE_SIZE,
    rows: rows.slice(0, ADMIN_PAGE_SIZE).map((row) => ({
      id: row.id,
      venueId: row.venue_id,
      venueName: one(row.venue)?.name ?? "A venue",
      weekday: row.target_weekday,
      status: row.status as AdminRun["status"],
      step: row.current_step,
      error: row.error_message,
      startedAt: row.created_at,
    })),
  }
}
