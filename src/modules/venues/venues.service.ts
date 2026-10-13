import "server-only"
import { cache } from "react"
import type { VenueRole } from "@/config/navigation"
import { ROLES } from "@/config/roles"
import { conflict, forbidden, notFound } from "@/lib/http/errors"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { RequestContext } from "@/modules/auth/types"
import { venuesRepository } from "./venues.repository"
import {
  toCents,
  toDollars,
  type DemoVenue,
  type MyVenue,
  type VenueDetail,
  type VenueIdentityInput,
  type VenueOnboardingInput,
  type VenueSettingsInput,
} from "./venues.schemas"

const settingsColumns = (input: VenueSettingsInput) => ({
  slow_night: input.slowNight,
  break_even_headcount: input.breakEvenHeadcount,
  capacity: input.capacity,
  capabilities: [...new Set(input.capabilities)],
  talent_budget_cents: toCents(input.talentBudgetDollars),
  average_spend_cents: toCents(input.averageSpendDollars),
})

// Administrators work on every venue as an owner would; RLS gives them the same rights.
async function roleAt(ctx: RequestContext, venueId: string): Promise<VenueRole | null> {
  const membership = await venuesRepository.findMembership(ctx.supabase, venueId, ctx.user.id)
  if (membership) return membership.role
  return ctx.user.role === ROLES.administrator ? "owner" : null
}

const loadDetail = cache(async (ctx: RequestContext, venueId: string): Promise<VenueDetail> => {
  const [venue, role, settings] = await Promise.all([
    venuesRepository.findVenue(ctx.supabase, venueId),
    roleAt(ctx, venueId),
    venuesRepository.findSettings(ctx.supabase, venueId),
  ])
  if (!venue || !role) throw notFound("This venue does not exist, or you are not part of it.")
  return {
    id: venue.id,
    name: venue.name,
    address: venue.address,
    venueType: venue.venue_type,
    role,
    googlePlaceId: venue.google_place_id,
    latitude: venue.latitude,
    longitude: venue.longitude,
    timeZone: venue.time_zone,
    settings: settings && {
      slowNight: settings.slow_night,
      breakEvenHeadcount: settings.break_even_headcount,
      capacity: settings.capacity,
      capabilities: settings.capabilities,
      talentBudgetDollars: toDollars(settings.talent_budget_cents),
      averageSpendDollars: toDollars(settings.average_spend_cents),
    },
  }
})

export const venuesService = {
  // Open to anyone: a demo venue counts as ready once the pipeline has finished a run for it.
  async listDemoVenues(supabase: ServerSupabase): Promise<DemoVenue[]> {
    const rows = await venuesRepository.listDemo(supabase)
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      venueType: row.venue_type,
      planReady: row.agent_runs.length > 0,
    }))
  },

  async listMine(ctx: RequestContext): Promise<MyVenue[]> {
    const rows = await venuesRepository.listMemberships(ctx.supabase, ctx.user.id)
    return rows.map(({ role, venue }) => ({
      id: venue.id,
      name: venue.name,
      address: venue.address,
      venueType: venue.venue_type,
      role,
    }))
  },

  getDetail: loadDetail,

  async create(ctx: RequestContext, input: VenueOnboardingInput): Promise<{ id: string }> {
    const id = await venuesRepository.create(ctx.supabase, {
      p_name: input.name,
      p_address: input.address,
      p_google_place_id: input.googlePlaceId,
      p_latitude: input.latitude,
      p_longitude: input.longitude,
      p_venue_type: input.venueType,
      p_time_zone: input.timeZone,
      p_capacity: input.capacity,
      p_capabilities: [...new Set(input.capabilities)],
      p_slow_night: input.slowNight,
      p_break_even_headcount: input.breakEvenHeadcount,
      p_talent_budget_cents: toCents(input.talentBudgetDollars),
      p_average_spend_cents: toCents(input.averageSpendDollars),
    })
    return { id }
  },

  async updateIdentity(ctx: RequestContext, venueId: string, input: VenueIdentityInput): Promise<void> {
    const saved = await venuesRepository.updateVenue(ctx.supabase, venueId, {
      name: input.name,
      address: input.address,
      google_place_id: input.googlePlaceId,
      latitude: input.latitude,
      longitude: input.longitude,
      venue_type: input.venueType,
      time_zone: input.timeZone,
    })
    if (!saved) throw forbidden("Only the venue's owner and managers can change it.")
  },

  async updateSettings(ctx: RequestContext, venueId: string, input: VenueSettingsInput): Promise<void> {
    const saved = await venuesRepository.updateSettings(ctx.supabase, venueId, settingsColumns(input))
    if (!saved) throw forbidden("Only the venue's owner and managers can change its settings.")
  },

  async remove(ctx: RequestContext, venueId: string, confirmName: string): Promise<void> {
    const venue = await loadDetail(ctx, venueId)
    if (confirmName.trim() !== venue.name) throw conflict("Type the venue's name exactly to delete it.")
    if (!(await venuesRepository.remove(ctx.supabase, venueId))) {
      throw forbidden("Only the venue's owner can delete it.")
    }
  },
}
