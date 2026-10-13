import "server-only"
import { MUSIC_FORMATS, TALENT } from "@/config/series"
import { formatMoney } from "@/lib/format"
import { conflict, notFound } from "@/lib/http/errors"
import { talentRequest, type GeoPoint } from "@/lib/qloo/requests"
import type { AdminSupabase } from "@/lib/supabase/admin"
import { createAdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { RequestContext } from "@/modules/auth/types"
import { receiptAt } from "@/modules/concepts/concepts.read"
import type { ReceiptView } from "@/modules/concepts/concepts.schemas"
import { runsRepository } from "@/modules/runs/runs.repository"
import type { RunContext } from "@/modules/runs/runs.schemas"
import { seriesRepository } from "@/modules/series/series.repository"
import type { TalentView } from "@/modules/series/series.schemas"
import { cachedQloo } from "@/modules/taste/taste.service"
import { managedVenue } from "@/modules/venues/venues.access"
import { toCents } from "@/modules/venues/venues.schemas"
import { actReceiptPath, actsFrom, conceptAnchors } from "./talent.anchors"
import { writeOutreach } from "./talent.outreach"
import { talentRepository, type TalentInsert } from "./talent.repository"
import { bookable, overlapOf, styleReferences, tierOf, type RankedAct } from "./talent.tiers"

export interface TalentVenue {
  id: string
  name: string
  point: GeoPoint
  timeZone: string
  talentBudgetCents: number
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

// Builds the shortlist for a night: acts whose fans share its tastes near the venue, in tiers a small room can book.
export async function findTalent(admin: AdminSupabase, venue: TalentVenue, night: TalentNight): Promise<number> {
  const run = await runsRepository.findRun(admin, night.runId)
  const anchors = conceptAnchors(night.conceptName, (run?.context ?? {}) as RunContext)
  if (anchors.length === 0) throw conflict("Plan this night again before looking for performers.")

  const type = MUSIC_FORMATS.includes(night.format) ? "urn:entity:artist" : "urn:entity:person"
  const [local, famous] = await Promise.all([
    cachedQloo(admin, talentRequest(anchors, type, venue.point, { max: TALENT.tierCeilings.regional })),
    cachedQloo(admin, talentRequest(anchors, type, venue.point, { min: TALENT.referenceMin })).catch(() => null),
  ])
  const shortlist = bookable(actsFrom(local.response))
  const references = famous
    ? styleReferences(
        actsFrom(famous.response),
        shortlist.map((act) => act.entityId),
      )
    : []

  const fitSignals = anchors.map((anchor) => anchor.name)
  const messages = await writeOutreach(
    {
      venue: venue.name,
      night: night.conceptName,
      acts: shortlist.map((act) => ({ actId: act.entityId, name: act.name, sharedTastes: fitSignals })),
    },
    {
      date: when(night.firstNight, venue.timeZone, { weekday: "long", month: "long", day: "numeric" }),
      time: when(night.firstNight, venue.timeZone, { hour: "numeric", minute: "2-digit" }),
      fee: venue.talentBudgetCents > 0 ? `up to ${formatMoney(venue.talentBudgetCents)}` : "a fee we agree together",
    },
  )

  const row = (act: RankedAct, cacheId: string): TalentInsert => ({
    concept_id: night.conceptId,
    venue_id: venue.id,
    qloo_entity_id: act.entityId,
    qloo_cache_id: cacheId,
    response_path: actReceiptPath(act.index),
    name: act.name.slice(0, 200),
    popularity_tier: tierOf(act.popularity),
    overlap_score: overlapOf(act.affinity),
    fit_signals: fitSignals,
    outreach_draft: messages.get(act.entityId) ?? null,
  })
  await talentRepository.replaceForConcept(admin, night.conceptId, [
    ...shortlist.map((act) => row(act, local.cacheId)),
    ...references.map((act) => row(act, famous?.cacheId ?? local.cacheId)),
  ])
  return shortlist.length
}

// The shortlist as the caller may see it. National names come back apart, as styles to look for.
export async function readTalent(
  supabase: ServerSupabase | AdminSupabase,
  conceptId: string,
): Promise<{ talent: TalentView[]; references: TalentView[] }> {
  const views = (await talentRepository.listForConcept(supabase, conceptId)).map((row): TalentView => ({
    id: row.id,
    name: row.name,
    tier: row.popularity_tier,
    overlap: Number(row.overlap_score),
    fitSignals: row.fit_signals,
    message: row.outreach_edited ?? row.outreach_draft,
    edited: row.outreach_edited !== null,
    hasReceipt: row.qloo_cache_id !== null,
  }))
  return {
    talent: views.filter((view) => view.tier !== "national"),
    references: views.filter((view) => view.tier === "national"),
  }
}

export async function readTalentReceipt(supabase: ServerSupabase, talentId: string): Promise<ReceiptView> {
  const act = await talentRepository.findForReceipt(supabase, talentId)
  if (!act?.qloo_cache_id || act.response_path.length === 0) throw notFound("That receipt is not available.")
  const tastes = act.fit_signals.join(", ")
  const claim = tastes ? `Fans of ${tastes} near you also follow ${act.name}` : `${act.name} fits this crowd`
  return receiptAt(act.qloo_cache_id, act.response_path, claim, Number(act.overlap_score))
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
        talentBudgetCents: toCents(venue.settings.talentBudgetDollars),
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

  async editOutreach(ctx: RequestContext, talentId: string, message: string): Promise<void> {
    if (!(await talentRepository.editOutreach(ctx.supabase, talentId, message)))
      throw notFound("That performer is not on your shortlist, or you cannot edit their message.")
  },
}
