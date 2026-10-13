import "server-only"
import { QLOO } from "@/config/integrations"
import { AUDIENCE_TAG_COUNT, TASTE_DOMAINS, type TasteDomain } from "@/config/taste"
import { mapWithLimit } from "@/lib/concurrency"
import { upstreamFailed } from "@/lib/http/errors"
import { qlooInsights } from "@/lib/qloo/client"
import { qlooRequestHash } from "@/lib/qloo/request-hash"
import {
  areaTagsRequest,
  nearbyPlacesRequest,
  tasteAudienceRequest,
  tasteEntitiesRequest,
  type GeoPoint,
  type QlooRequest,
} from "@/lib/qloo/requests"
import { qlooInsightsSchema, type QlooInsights } from "@/lib/qloo/schemas"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { Json } from "@/types/database"
import { withStep, type StepContext } from "@/modules/runs/runs.steps"
import { audienceSkew, domainResult, failedDomain } from "./taste.fingerprint"
import { tasteRepository } from "./taste.repository"
import type { AudienceSkew, TasteDomainResult, TasteFingerprint } from "./taste.schemas"

export interface CachedInsight {
  cacheId: string
  response: QlooInsights
  fromCache: boolean
}

export interface Neighbourhood {
  point: GeoPoint
  radiusMetres: number
}

const asJson = (value: unknown) => value as Json

function parseCached(response: Json): QlooInsights | null {
  const parsed = qlooInsightsSchema.safeParse(response)
  return parsed.success ? parsed.data : null
}

// Reuses a fresh cached answer; otherwise asks Qloo and stores the answer, keeping any older one as history.
export async function cachedQloo(admin: AdminSupabase, request: QlooRequest): Promise<CachedInsight> {
  const hash = qlooRequestHash(request.path, request.params)
  const current = await tasteRepository.findCurrent(admin, hash)
  const cached = current && Date.parse(current.expiresAt) > Date.now() ? parseCached(current.response) : null
  if (current && cached) return { cacheId: current.id, response: cached, fromCache: true }

  const result = await qlooInsights(request)
  const stored = await tasteRepository.store(admin, {
    requestHash: hash,
    endpoint: request.path,
    request: asJson(result.request),
    response: asJson(result.response),
    ttlDays: QLOO.cacheTtlDays,
  })
  if (stored) return { cacheId: stored, response: result.response, fromCache: false }

  const winner = await tasteRepository.findCurrent(admin, hash)
  const winnerResponse = winner ? parseCached(winner.response) : null
  if (!winner || !winnerResponse) throw upstreamFailed("Qloo")
  return { cacheId: winner.id, response: winnerResponse, fromCache: false }
}

function domainRequest(domain: TasteDomain, area: Neighbourhood): QlooRequest {
  const { source } = domain
  if (source.kind === "tags") return areaTagsRequest(area.point, source.tagType)
  if (source.kind === "nearby_places") return nearbyPlacesRequest(area.point, area.radiusMetres)
  return tasteEntitiesRequest(source.type, area.point, source.popularity)
}

const tracedQloo = (admin: AdminSupabase, request: QlooRequest, label: string, trace?: StepContext) =>
  withStep(
    trace,
    "qloo.insights",
    asJson({ label, ...request }),
    () => cachedQloo(admin, request),
    (answer) => ({ summary: { label, fromCache: answer.fromCache }, cacheId: answer.cacheId }),
  )

async function readDomain(admin: AdminSupabase, domain: TasteDomain, area: Neighbourhood, trace?: StepContext) {
  try {
    const answer = await tracedQloo(admin, domainRequest(domain, area), domain.id, trace)
    return domainResult(domain, answer.response, answer.cacheId)
  } catch {
    return failedDomain(domain)
  }
}

// Who loves the area's leading music and night-out styles. Null when there is nothing to base it on.
async function readAudience(
  admin: AdminSupabase,
  domains: TasteDomainResult[],
  trace?: StepContext,
): Promise<AudienceSkew | null> {
  const basedOn = domains
    .filter((domain) => domain.domain === "music_styles" || domain.domain === "place_styles")
    .flatMap((domain) => domain.items.slice(0, AUDIENCE_TAG_COUNT - 1))
    .slice(0, AUDIENCE_TAG_COUNT)
    .map((item) => ({ id: item.id, name: item.name }))
  if (basedOn.length === 0) return null
  try {
    const request = tasteAudienceRequest(basedOn.map((tag) => tag.id))
    const answer = await tracedQloo(admin, request, "audience", trace)
    return audienceSkew(answer.response, answer.cacheId, basedOn)
  } catch {
    return null
  }
}

// Pipeline step 2: domains three at a time (the hackathon key rate limits bursts), failures kept, then the audience.
export async function readNeighbourhood(
  admin: AdminSupabase,
  area: Neighbourhood,
  trace?: StepContext,
): Promise<TasteFingerprint> {
  const domains = await mapWithLimit(TASTE_DOMAINS, QLOO.maxConcurrent, (domain) =>
    readDomain(admin, domain, area, trace),
  )
  const audience = await readAudience(admin, domains, trace)
  return { domains, audience }
}
