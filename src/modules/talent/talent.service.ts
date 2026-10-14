import "server-only"
import { MUSIC_FORMATS, TALENT, type TalentSource } from "@/config/series"
import { formatMoney } from "@/lib/format"
import { conflict, notFound } from "@/lib/http/errors"
import { talentRequest, type GeoPoint } from "@/lib/qloo/requests"
import type { AdminSupabase } from "@/lib/supabase/admin"
import { createAdminSupabase } from "@/lib/supabase/admin"
import type { Json } from "@/types/database"
import type { RequestContext } from "@/modules/auth/types"
import { runsRepository } from "@/modules/runs/runs.repository"
import type { RunContext } from "@/modules/runs/runs.schemas"
import { seriesRepository } from "@/modules/series/series.repository"
import type { TalentEditInput } from "@/modules/series/series.schemas"
import { cachedQloo } from "@/modules/taste/taste.service"
import { managedVenue } from "@/modules/venues/venues.access"
import { toCents } from "@/modules/venues/venues.schemas"
import { actReceiptPath, actsFrom, conceptAnchors, messageTastes } from "./talent.anchors"
import { writeOutreach } from "./talent.outreach"
import { talentRepository, type TalentInsert } from "./talent.repository"
import {
  activeMusicians,
  nextPage,
  overlapOf,
  shortlistOf,
  styleReferences,
  tierOf,
  type RankedAct,
} from "./talent.tiers"

export interface TalentVenue {
  id: string
  name: string
  point: GeoPoint
  timeZone: string
  talentBudgetCents: number
  currency: string
}

export interface TalentNight {
  conceptId: string
  conceptName: string
  format: string
  runId: string
  firstNight: string
}

const when = (iso: string, timeZone: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...options, timeZone }).format(new Date(iso))

// Builds the shortlist for a night, local first: the area's own favourites who suit the night, then the area's
// favourites, then other acts whose fans share its tastes. Each look moves a page on, so the list is fresh every time.
// Acts the owner booked or reworded are never replaced.
export async function findTalent(admin: AdminSupabase, venue: TalentVenue, night: TalentNight): Promise<number> {
  const [run, current] = await Promise.all([
    runsRepository.findRun(admin, night.runId),
    talentRepository.currentList(admin, night.conceptId),
  ])
  const anchors = conceptAnchors(night.conceptName, (run?.context ?? {}) as RunContext)
  if (anchors.length === 0) throw conflict("Plan this night again before looking for performers.")

  const music = MUSIC_FORMATS.includes(night.format)
  const type = music ? "urn:entity:artist" : "urn:entity:person"
  const band = { max: TALENT.tierCeilings.regional }
  const kept = new Set(current.filter((row) => row.booked_at || row.outreach_edited).map((row) => row.qloo_entity_id))
  const usable = (acts: RankedAct[]) => (music ? activeMusicians(acts) : acts).filter((act) => !kept.has(act.entityId))
  const look = async (page: number) => {
    const [fits, area] = await Promise.all([
      cachedQloo(admin, talentRequest(anchors, type, venue.point, band, page)),
      cachedQloo(admin, talentRequest([], type, venue.point, band, page)).catch(() => null),
    ])
    const shortlist = shortlistOf(usable(actsFrom(fits.response)), area ? usable(actsFrom(area.response)) : [])
    return { page, fits, area, shortlist }
  }

  // A later page that holds nobody bookable starts again from the first, so a look never leaves the list empty.
  const famousAnswer = cachedQloo(admin, talentRequest(anchors, type, venue.point, { min: TALENT.referenceMin })).catch(
    () => null,
  )
  const asked = current.length > 0 ? nextPage(Math.max(...current.map((row) => row.search_page))) : 1
  const first = await look(asked)
  const { page, fits, area, shortlist } = first.shortlist.length === 0 && asked !== 1 ? await look(1) : first
  const famous = await famousAnswer
  const references = famous
    ? styleReferences(actsFrom(famous.response), [...shortlist.map((act) => act.entityId), ...kept])
    : []

  const fitSignals = anchors.map((anchor) => anchor.name)
  const sharedTastes = messageTastes(anchors)
  const messages = await writeOutreach(
    {
      venue: venue.name,
      night: night.conceptName,
      acts: shortlist.map((act) => ({ actId: act.entityId, name: act.name, sharedTastes })),
    },
    {
      date: when(night.firstNight, venue.timeZone, { weekday: "long", month: "long", day: "numeric" }),
      time: when(night.firstNight, venue.timeZone, { hour: "numeric", minute: "2-digit" }),
      fee:
        venue.talentBudgetCents > 0
          ? `up to ${formatMoney(venue.talentBudgetCents, venue.currency)}`
          : "a fee we agree together",
    },
  )

  const row = (act: RankedAct, source: TalentSource, cacheId: string): TalentInsert => ({
    concept_id: night.conceptId,
    venue_id: venue.id,
    qloo_entity_id: act.entityId,
    qloo_cache_id: cacheId,
    response_path: actReceiptPath(act.index),
    name: act.name.slice(0, 200),
    popularity_tier: tierOf(act.popularity),
    overlap_score: overlapOf(act.affinity),
    fit_signals: source === "area" ? [] : fitSignals,
    outreach_draft: messages.get(act.entityId) ?? null,
    profile: act.profile as unknown as Json,
    source,
    search_page: page,
  })
  await talentRepository.refreshForConcept(admin, night.conceptId, [
    ...shortlist.map((act) => row(act, act.source, act.source === "area" && area ? area.cacheId : fits.cacheId)),
    ...references.map((act) => row(act, "night", famous?.cacheId ?? fits.cacheId)),
  ])
  return shortlist.length
}

export const talentService = {
  async find(ctx: RequestContext, seriesId: string): Promise<{ found: number }> {
    const series = await seriesRepository.findById(ctx.supabase, seriesId)
    const first = series?.event_nights.find((night) => night.sequence === 1)
    if (!series || !first) throw notFound("That series does not exist, or you cannot see it.")
    const venue = await managedVenue(ctx, series.venue_id)
    const concept = await seriesRepository.findConcept(ctx.supabase, series.concept_id)
    if (!concept) throw notFound("The night behind this series is missing.")
    const found = await findTalent(
      createAdminSupabase(),
      {
        id: venue.id,
        name: venue.name,
        point: { latitude: Number(venue.latitude), longitude: Number(venue.longitude) },
        timeZone: venue.timeZone,
        talentBudgetCents: toCents(venue.settings.talentBudget),
        currency: venue.currency,
      },
      {
        conceptId: concept.id,
        conceptName: concept.name,
        format: concept.format,
        runId: concept.run_id,
        firstNight: first.starts_at,
      },
    )
    return { found }
  },

  // Reword the message, or mark the act as booked. Both go through the caller's own client, so RLS decides.
  async update(ctx: RequestContext, talentId: string, input: TalentEditInput): Promise<void> {
    const changes =
      "message" in input
        ? { outreach_edited: input.message }
        : { booked_at: input.booked ? new Date().toISOString() : null }
    if (!(await talentRepository.updateOwn(ctx.supabase, talentId, changes)))
      throw notFound("That performer is not on your shortlist, or you cannot change them.")
  },
}
