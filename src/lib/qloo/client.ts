import "server-only"
import type { ZodType } from "zod"
import { QLOO, type QlooEntityType } from "@/config/integrations"
import { qlooEnv } from "@/lib/env/server"
import { upstreamFailed } from "@/lib/http/errors"
import { fetchUpstream } from "@/lib/http/upstream"
import { canonicalQlooRequest, qlooRequestHash, toSearchParams } from "./request-hash"
import { searchRequest, tagsRequest, type GeoPoint, type QlooRequest } from "./requests"
import { qlooInsightsSchema, qlooSearchSchema, qlooTagLookupSchema } from "./schemas"

export interface QlooResult<T> {
  requestHash: string
  request: ReturnType<typeof canonicalQlooRequest>
  response: T
}

async function call<T>({ path, params }: QlooRequest, schema: ZodType<T>, empty?: T): Promise<QlooResult<T>> {
  const { QLOO_API_KEY, QLOO_API_URL } = qlooEnv()
  const request = canonicalQlooRequest(path, params)
  const response = await fetchUpstream({
    service: "Qloo",
    url: `${QLOO_API_URL}${path}?${toSearchParams(request.params)}`,
    init: { headers: { "X-Api-Key": QLOO_API_KEY, Accept: "application/json" } },
    timeoutMs: QLOO.timeoutMs,
    schema,
    retryOnRateLimit: true,
    emptyOn: empty === undefined ? undefined : { status: 404, value: empty },
  })
  if ((response as { success?: unknown }).success === false) throw upstreamFailed("Qloo")
  return { requestHash: qlooRequestHash(path, params), request, response }
}

// A raw insights call. Callers go through the taste repository, which caches every answer for its receipts.
export const qlooInsights = (request: QlooRequest) => call(request, qlooInsightsSchema)

// `/search` answers 404 when nothing matches, which is an empty result rather than a failure.
export const qlooSearch = (
  query: string,
  types: readonly QlooEntityType[],
  near?: { point: GeoPoint; radiusMetres: number },
) => call(searchRequest(query, types, near), qlooSearchSchema, { results: [] })

export const qlooTags = (query: string, tagType?: string) =>
  call(tagsRequest(query, tagType), qlooTagLookupSchema, { results: { tags: [] } })
