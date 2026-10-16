import "server-only"
import { ROUTES } from "@/config/site"
import { sendEmail } from "@/lib/email/mailer"
import { emailTemplates } from "@/lib/email/templates"
import { publicEnv } from "@/lib/env/public"
import { conflict, forbidden } from "@/lib/http/errors"
import { absoluteUrl } from "@/modules/auth/auth.links"
import { createAccountLink, createInvite, findAccount } from "@/modules/auth/server/identity"
import type { RequestContext } from "@/modules/auth/types"
import { venuesRepository } from "@/modules/venues/venues.repository"
import { venuesService } from "@/modules/venues/venues.service"
import { teamRepository } from "./team.repository"
import {
  VENUE_ROLE_LABELS,
  type ChangeRoleInput,
  type InviteInput,
  type InviteResult,
  type TeamMember,
} from "./team.schemas"

const appUrl = () => publicEnv.NEXT_PUBLIC_APP_URL

async function requireOwner(ctx: RequestContext, venueId: string) {
  const venue = await venuesService.getDetail(ctx, venueId)
  if (venue.role !== "owner") throw forbidden("Only the venue's owner can change the team.")
  return venue
}

export const teamService = {
  async list(ctx: RequestContext, venueId: string): Promise<TeamMember[]> {
    await venuesService.getDetail(ctx, venueId)
    const rows = await teamRepository.list(ctx.supabase, venueId)
    return rows.map((row) => ({
      userId: row.user_id,
      name: row.profile?.display_name ?? row.profile?.email ?? "Invited person",
      email: row.profile?.email ?? null,
      role: row.role,
      isYou: row.user_id === ctx.user.id,
    }))
  },

  // Ownership is checked before anything is created, so a stranger cannot make accounts through this.
  async invite(ctx: RequestContext, venueId: string, input: InviteInput): Promise<InviteResult> {
    const venue = await requireOwner(ctx, venueId)
    if (input.email === ctx.user.email) throw conflict("You are already on this team.")

    const existing = await findAccount(input.email)
    const inviterName = ctx.user.displayName ?? ctx.user.email ?? "Your colleague"
    const roleLabel = VENUE_ROLE_LABELS[input.role].toLowerCase()

    const door = input.role === "door"

    // Someone with an account may never have chosen a password (an older invite they did not finish), or may have
    // forgotten it, so their email always carries a fresh link to choose one. Inviting them again resends it.
    if (existing) {
      const member = await venuesRepository.findMembership(ctx.supabase, venueId, existing.id)
      if (!member) await teamRepository.add(ctx.supabase, venueId, existing.id, input.role, ctx.user.id)
      const passwordUrl = await createAccountLink(input.email, "recovery")
      const signInUrl = absoluteUrl(appUrl(), ROUTES.venue(venueId))
      await sendEmail({
        to: input.email,
        ...emailTemplates.addedToTeam({ venueName: venue.name, inviterName, roleLabel, signInUrl, passwordUrl, door }),
      })
      return { status: member ? "resent" : "added" }
    }

    const invite = await createInvite(input.email)
    await teamRepository.add(ctx.supabase, venueId, invite.userId, input.role, ctx.user.id)
    await sendEmail({
      to: input.email,
      ...emailTemplates.teamInvite({ venueName: venue.name, inviterName, roleLabel, url: invite.url, door }),
    })
    return { status: "invited" }
  },

  async changeRole(ctx: RequestContext, venueId: string, userId: string, input: ChangeRoleInput): Promise<void> {
    await requireOwner(ctx, venueId)
    if (!(await teamRepository.changeRole(ctx.supabase, venueId, userId, input.role))) {
      throw forbidden("The owner's role cannot be changed.")
    }
  },

  async remove(ctx: RequestContext, venueId: string, userId: string): Promise<void> {
    await requireOwner(ctx, venueId)
    if (!(await teamRepository.remove(ctx.supabase, venueId, userId))) {
      throw forbidden("The owner cannot be removed from their own venue.")
    }
  },
}
