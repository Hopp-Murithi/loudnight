import "server-only"
import { conflict, forbidden, fromDatabaseError, notFound, validationFailed } from "@/lib/http/errors"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { RequestContext } from "@/modules/auth/types"
import { seriesRepository } from "@/modules/series/series.repository"
import { readTalent } from "@/modules/talent/talent.read"
import { managedVenue } from "@/modules/venues/venues.access"
import { checkinCode } from "./events.codes"
import { readEventPage } from "./events.read"
import { eventsRepository } from "./events.repository"
import type { NightAction, RsvpValues } from "./events.schemas"

const BLURB_MAX = 400
const LINEUP_MAX = 8

// A guest RSVPs to a published night. The server makes the code; the guest's own client writes the row.
async function rsvp(supabase: ServerSupabase, slug: string, input: RsvpValues): Promise<{ code: string }> {
  // The trap field: a person never sees it, so anything in it came from a bot.
  if (input.website) throw validationFailed({})
  const page = await readEventPage(supabase, slug)
  if (!page) throw notFound("This night does not exist.")
  if (page.status === "cancelled") throw conflict("This night has been cancelled.")
  if (page.past) throw conflict("This night has already happened.")
  const code = checkinCode()
  const failure = await eventsRepository.reservePlace(supabase, {
    nightId: page.nightId,
    name: input.name,
    partySize: input.partySize,
    contact: input.contact ?? null,
    code,
  })
  if (failure === "23505") throw conflict("You're already on the list for this night. Use the ticket you got then.")
  if (failure) throw fromDatabaseError({ code: failure })
  return { code }
}

// What a published night shows the world: its name, its one-line pitch, and who is booked, in the order they said yes.
async function publicFace(ctx: RequestContext, seriesId: string) {
  const series = await seriesRepository.findById(ctx.supabase, seriesId)
  const concept = series ? await seriesRepository.findConcept(ctx.supabase, series.concept_id) : null
  if (!concept) throw notFound("The night behind this series is missing.")
  const { talent, references } = await readTalent(ctx.supabase, concept.id)
  const lineup = [...talent, ...references]
    .filter((act) => act.bookedAt !== null)
    .sort((a, b) => (a.bookedAt ?? "").localeCompare(b.bookedAt ?? ""))
    .map((act) => act.name)
    .slice(0, LINEUP_MAX)
  return { title: concept.name, blurb: concept.pitch.slice(0, BLURB_MAX), lineup }
}

// Publish, take back to draft, or cancel one night. Owners and managers only; RLS refuses everyone else too.
async function changeNight(ctx: RequestContext, nightId: string, action: NightAction): Promise<{ status: string }> {
  const night = await eventsRepository.findNight(ctx.supabase, nightId)
  if (!night) throw notFound("That night does not exist, or you cannot see it.")
  await managedVenue(ctx, night.venue_id)

  if (action === "publish") {
    const face = await publicFace(ctx, night.series_id)
    const moved = await eventsRepository.moveNight(ctx.supabase, nightId, ["draft", "cancelled"], {
      ...face,
      status: "published",
      published_at: new Date().toISOString(),
    })
    if (!moved) throw conflict("This night is already published.")
    return { status: "published" }
  }
  if (action === "cancel") {
    if (!(await eventsRepository.moveNight(ctx.supabase, nightId, ["published"], { status: "cancelled" })))
      throw conflict("Only a published night can be cancelled.")
    return { status: "cancelled" }
  }
  if ((await eventsRepository.countRsvps(ctx.supabase, nightId)) > 0)
    throw conflict("People have already RSVP'd. Cancel the night instead, so they see a notice.")
  if (!(await eventsRepository.moveNight(ctx.supabase, nightId, ["published"], { status: "draft" })))
    throw forbidden("Only a published night can go back to draft.")
  return { status: "draft" }
}

export const eventsService = { rsvp, changeNight }
