import "server-only"
import { countryName } from "@/config/countries"
import { MUSIC_FORMATS, OPEN_TALENT, TALENT, type TalentSource } from "@/config/series"
import { formatMoney } from "@/lib/format"
import { conflict } from "@/lib/http/errors"
import { localSoundRequest, talentRequest, type GeoPoint } from "@/lib/qloo/requests"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { Json } from "@/types/database"
import { runsRepository } from "@/modules/runs/runs.repository"
import type { RunContext } from "@/modules/runs/runs.schemas"
import { cachedQloo } from "@/modules/taste/taste.service"
import { actReceiptPath, actsFrom, conceptAnchors, localSoundAnchors, messageTastes } from "./talent.anchors"
import { openSearchFor } from "./talent.open"
import { openActs } from "./talent.open-data"
import { writeOutreach } from "./talent.outreach"
import { vetActs } from "./talent.vet"
import { aboutCountry, fitActs, homeGrownFirst } from "./talent.fit"
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
  countryCode: string | null
  town: string | null
  hosts: string[]
}

export interface TalentNight {
  conceptId: string
  conceptName: string
  format: string
  runId: string
  firstNight: string
}

// The first copy of each act wins, so an act found through the local sound keeps that receipt.
const uniqueActs = <T extends RankedAct>(acts: T[]): T[] =>
  acts.filter((act, index) => acts.findIndex((other) => other.entityId === act.entityId) === index)

type QlooAnswer = Awaited<ReturnType<typeof cachedQloo>>

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
  const context = (run?.context ?? {}) as RunContext
  const anchors = conceptAnchors(night.conceptName, context)
  if (anchors.length === 0) throw conflict("Plan this night again before looking for performers.")

  const music = MUSIC_FORMATS.includes(night.format)
  const type = music ? "urn:entity:artist" : "urn:entity:person"
  const band = { max: TALENT.tierCeilings.regional }
  const kept = new Set(current.filter((row) => row.booked_at || row.outreach_edited).map((row) => row.qloo_entity_id))
  const openAnswer = openActs(admin, openSearchFor(night.format, venue.hosts, night.conceptName), venue)
  const usable = (acts: RankedAct[]) => (music ? activeMusicians(acts) : acts).filter((act) => !kept.has(act.entityId))
  const fitSignals = anchors.map((anchor) => anchor.name)
  const localSound = music ? localSoundAnchors(context, countryName(venue.countryCode ?? "US")) : []
  // Each act keeps the answer it came from (its receipt) and the tastes that linked it to the night.
  const from = (answer: QlooAnswer | null, signals: string[]) =>
    answer ? usable(actsFrom(answer.response)).map((act) => ({ ...act, cacheId: answer.cacheId, signals })) : []
  const look = async (page: number) => {
    const [fits, area, local] = await Promise.all([
      cachedQloo(admin, talentRequest(anchors, type, venue.point, band, page)),
      cachedQloo(admin, talentRequest([], type, venue.point, band, page)).catch(() => null),
      localSound.length > 0
        ? cachedQloo(
            admin,
            localSoundRequest(
              localSound.map((signal) => signal.qlooId),
              type,
              venue.point,
              band,
              page,
            ),
          ).catch(() => null)
        : Promise.resolve(null),
    ])
    const nightActs = uniqueActs([
      ...from(
        local,
        localSound.map((signal) => signal.name),
      ),
      ...from(fits, fitSignals),
    ])
    const shortlist = shortlistOf(nightActs, from(area, []), TALENT.vetPool)
    return { page, fits, shortlist }
  }

  // A later page that holds nobody bookable starts again from the first, so a look never leaves the list empty.
  const famousAnswer = cachedQloo(admin, talentRequest(anchors, type, venue.point, { min: TALENT.referenceMin })).catch(
    () => null,
  )
  const asked = current.length > 0 ? nextPage(Math.max(...current.map((row) => row.search_page))) : 1
  const first = await look(asked)
  const { page, fits, shortlist } = first.shortlist.length === 0 && asked !== 1 ? await look(1) : first
  const famous = await famousAnswer
  const references = famous
    ? styleReferences(actsFrom(famous.response), [...shortlist.map((act) => act.entityId), ...kept])
    : []

  const taken = new Set([...kept, ...shortlist.map((act) => act.entityId)])
  const names = new Set(shortlist.map((act) => act.name.toLowerCase()))
  const pool = (await openAnswer).filter((act) => !taken.has(act.entityId) && !names.has(act.name.toLowerCase()))
  // Qloo says who the crowd follows; this check adds where each act is from and whether a small room could book them.
  const verdicts = await vetActs(
    [...shortlist, ...pool].map((act) => act.name),
    countryName(venue.countryCode ?? "US"),
  )
  const country = venue.countryCode
  const fittedQloo = fitActs(shortlist, verdicts, country, night.format, Number.POSITIVE_INFINITY)
  const fittedOpen = fitActs(pool, verdicts, country, night.format, Number.POSITIVE_INFINITY)
  // Enough home-grown acts, or a night about the country itself, and acts from elsewhere are left out altogether.
  const about = aboutCountry(night.conceptName, countryName(country ?? "US"))
  const welcome = new Set(homeGrownFirst([...fittedQloo, ...fittedOpen], country, about).map((act) => act.entityId))
  const fromQloo = fittedQloo.filter((act) => welcome.has(act.entityId)).slice(0, TALENT.shortlistSize)
  // Where Qloo knows few home-grown acts, home-grown open records take the places foreign acts would have had.
  const homeFromQloo = fromQloo.filter((act) => act.home === country).length
  const openRoom = Math.max(OPEN_TALENT.keep, TALENT.shortlistSize - homeFromQloo)
  const open = fittedOpen.filter((act) => welcome.has(act.entityId)).slice(0, openRoom)
  const offered = [...fromQloo, ...open]

  const sharedTastes = messageTastes(anchors)
  const messages = await writeOutreach(
    {
      venue: venue.name,
      night: night.conceptName,
      acts: offered.map((act) => ({ actId: act.entityId, name: act.name, sharedTastes })),
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

  const row = (act: RankedAct, source: TalentSource, cacheId: string | null, signals: string[]): TalentInsert => ({
    concept_id: night.conceptId,
    venue_id: venue.id,
    qloo_entity_id: act.entityId,
    qloo_cache_id: cacheId,
    response_path: cacheId ? actReceiptPath(act.index) : [],
    name: act.name.slice(0, 200),
    popularity_tier: tierOf(act.popularity),
    overlap_score: overlapOf(act.affinity),
    fit_signals: source === "night" || source === "both" ? signals.slice(0, 4) : [],
    outreach_draft: messages.get(act.entityId) ?? null,
    profile: {
      ...act.profile,
      star: verdicts.get(act.name)?.star ?? null,
      home: verdicts.get(act.name)?.home ?? null,
    } as unknown as Json,
    source,
    search_page: page,
  })
  await talentRepository.refreshForConcept(admin, night.conceptId, [
    ...fromQloo.map((act) => row(act, act.source, act.cacheId, act.signals)),
    ...open.map((act) => row(act, act.source, null, [])),
    ...references.map((act) => row(act, "night", famous?.cacheId ?? fits.cacheId, fitSignals)),
  ])
  return offered.length
}
