import { isPresentableName } from "@/config/content"
import { AGE_BAND_LABELS, FINGERPRINT_TOP_ITEMS, type TasteDomain } from "@/config/taste"
import type { QlooInsights } from "@/lib/qloo/schemas"
import type { AudienceSkew, Lean, TasteDomainResult, TasteItem } from "./taste.schemas"

const GENDER_LABELS: Record<string, string> = { female: "Women", male: "Men" }

// Spreads affinities across 0..1 within one list for scoring. The raw value stays the receipt.
export function normaliseScores(values: readonly number[]): number[] {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max === min) return values.map(() => 1)
  return values.map((value) => (value - min) / (max - min))
}

// Qloo tag names arrive untidy (" blues", "Alt- country"). Display only; the id and receipt are unchanged.
export function tidyName(name: string): string {
  const tidy = name.trim().replace(/\s+/g, " ").replace(/-\s+/g, "-")
  return tidy.charAt(0).toUpperCase() + tidy.slice(1)
}

interface RawItem {
  id: string
  name: string
  affinity: number
  popularity: number | null
  path: string[]
}

function rawItems(domain: TasteDomain, response: QlooInsights): RawItem[] {
  if (domain.source.kind === "tags") {
    return (response.results?.tags ?? []).map((tag, index) => ({
      id: tag.tag_id,
      name: tidyName(tag.name),
      affinity: tag.query.affinity,
      popularity: tag.popularity ?? null,
      path: ["results", "tags", String(index), "query", "affinity"],
    }))
  }
  return (response.results?.entities ?? []).flatMap((entity, index) =>
    entity.query
      ? [
          {
            id: entity.entity_id,
            name: entity.name,
            affinity: entity.query.affinity,
            popularity: entity.popularity ?? null,
            path: ["results", "entities", String(index), "query", "affinity"],
          },
        ]
      : [],
  )
}

// One domain tile. Order is Qloo's rank, which carries more signal than affinities that cluster near 1.
export function domainResult(domain: TasteDomain, response: QlooInsights, cacheId: string): TasteDomainResult {
  const top = rawItems(domain, response)
    .filter((item) => isPresentableName(item.name))
    .slice(0, FINGERPRINT_TOP_ITEMS)
  const scores = normaliseScores(top.map((_, index) => top.length - index))
  const items: TasteItem[] = top.map((item, index) => ({
    id: item.id,
    name: item.name,
    affinity: item.affinity,
    score: scores[index],
    popularity: item.popularity,
    receipt: { cacheId, path: item.path },
  }))
  return { domain: domain.id, label: domain.label, status: items.length > 0 ? "ok" : "empty", items }
}

export const failedDomain = (domain: TasteDomain): TasteDomainResult => ({
  domain: domain.id,
  label: domain.label,
  status: "failed",
  items: [],
})

function leans(
  values: Record<string, number> | undefined,
  labels: Record<string, string>,
  base: string[],
  cacheId: string,
) {
  return Object.entries(values ?? {}).map(([key, value]): Lean => ({
    key,
    label: labels[key] ?? tidyName(key),
    value,
    receipt: { cacheId, path: [...base, key] },
  }))
}

// Who loves the area's leading tastes, from -1 (much less than average) to 1 (much more).
export function audienceSkew(
  response: QlooInsights,
  cacheId: string,
  basedOn: AudienceSkew["basedOn"],
): AudienceSkew | null {
  const row = response.results?.demographics?.[0]
  if (!row) return null
  const base = ["results", "demographics", "0", "query"]
  return {
    basedOn,
    age: leans(row.query.age, AGE_BAND_LABELS, [...base, "age"], cacheId),
    gender: leans(row.query.gender, GENDER_LABELS, [...base, "gender"], cacheId),
  }
}
