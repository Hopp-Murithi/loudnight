import { TASTE_DOMAINS, type TasteDomainId } from "@/config/taste"
import type { QlooSignalRef } from "@/lib/qloo/requests"
import type { QlooInsights } from "@/lib/qloo/schemas"
import type { Receipt, TasteFingerprint } from "@/modules/taste/taste.schemas"

export type SignalCategory =
  "music" | "night_out" | "film" | "tv" | "brands" | "books" | "podcasts" | "people" | "travel"

// Nearby places are the competition, not a taste to build on, so they never become signals.
const CATEGORY: Record<TasteDomainId, SignalCategory | null> = {
  music_styles: "music",
  music: "music",
  place_styles: "night_out",
  places: null,
  film: "film",
  tv: "tv",
  brands: "brands",
  books: "books",
  podcasts: "podcasts",
  people: "people",
  destinations: "travel",
}

export interface Signal extends QlooSignalRef {
  id: string
  domain: TasteDomainId
  category: SignalCategory
  name: string
  affinity: number
  receipt: Receipt
}

export interface OverlapResult {
  id: string
  anchorId: string
  targetId: string
  found: boolean
  affinity: number | null
  rank: number | null
  receipt: Receipt | null
}

// Every fingerprint item the planner may build on, with a short id it cites instead of restating numbers.
export function buildSignals(fingerprint: TasteFingerprint): Signal[] {
  return fingerprint.domains
    .flatMap((result) => {
      const domain = TASTE_DOMAINS.find((candidate) => candidate.id === result.domain)
      const category = domain ? CATEGORY[domain.id] : null
      if (!domain || !category || domain.source.kind === "nearby_places") return []
      const source = domain.source
      return result.items.map((item) => ({
        id: "",
        domain: domain.id,
        category,
        name: item.name,
        kind: source.kind === "tags" ? ("tag" as const) : ("entity" as const),
        qlooId: item.id,
        qlooType: source.kind === "tags" ? source.tagType : source.type,
        affinity: item.affinity,
        receipt: item.receipt,
      }))
    })
    .map((signal, index) => ({ ...signal, id: `s${index + 1}` }))
}

// What the model sees: names and ids only. Numbers stay with Loudnight and reach the screen from receipts.
export const signalsForModel = (signals: Signal[]) =>
  signals.map((signal) => ({ signalId: signal.id, category: signal.category, name: signal.name }))

// Looks for the target in an overlap answer and points a receipt at its affinity.
export function readOverlap(
  response: QlooInsights,
  cacheId: string,
  ids: { id: string; anchorId: string; target: Signal },
): OverlapResult {
  const { target } = ids
  const list = target.kind === "tag" ? (response.results?.tags ?? []) : (response.results?.entities ?? [])
  const index = list.findIndex((item) => ("tag_id" in item ? item.tag_id : item.entity_id) === target.qlooId)
  const hit = index >= 0 ? list[index] : undefined
  const affinity = hit?.query?.affinity
  const base = { id: ids.id, anchorId: ids.anchorId, targetId: target.id }
  if (affinity === undefined) return { ...base, found: false, affinity: null, rank: null, receipt: null }
  const listKey = target.kind === "tag" ? "tags" : "entities"
  return {
    ...base,
    found: true,
    affinity,
    rank: index + 1,
    receipt: { cacheId, path: ["results", listKey, String(index), "query", "affinity"] },
  }
}
