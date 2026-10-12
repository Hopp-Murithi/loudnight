import "server-only"
import { z } from "zod"
import { QLOO } from "@/config/integrations"
import { qlooEnv } from "@/lib/env/server"
import { fetchUpstream } from "@/lib/http/upstream"
import { canonicalQlooRequest, qlooRequestHash, toSearchParams, type QlooParams } from "./request-hash"

const responseSchema = z.record(z.string(), z.unknown())

export interface QlooResult {
  requestHash: string
  request: ReturnType<typeof canonicalQlooRequest>
  response: z.infer<typeof responseSchema>
}

// A raw Qloo call. Callers go through the taste repository, which caches every answer for its receipts.
export async function qlooGet(path: string, params: QlooParams): Promise<QlooResult> {
  const { QLOO_API_KEY, QLOO_API_URL } = qlooEnv()
  const request = canonicalQlooRequest(path, params)
  const response = await fetchUpstream({
    service: "Qloo",
    url: `${QLOO_API_URL}${path}?${toSearchParams(request.params)}`,
    init: { headers: { "X-Api-Key": QLOO_API_KEY, Accept: "application/json" } },
    timeoutMs: QLOO.timeoutMs,
    schema: responseSchema,
  })
  return { requestHash: qlooRequestHash(path, params), request, response }
}
