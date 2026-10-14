import "server-only"
import { z } from "zod"
import { OPEN_DATA } from "@/config/integrations"
import { fetchUpstream } from "@/lib/http/upstream"

const valueSchema = z.object({ value: z.string() })
const bindingSchema = z.record(z.string(), valueSchema)
const answerSchema = z.object({ results: z.object({ bindings: z.array(bindingSchema) }) })

export type WikidataRow = Record<string, string>

// Runs one read-only SPARQL query against the public Wikidata endpoint and returns plain rows of values.
export async function sparql(query: string): Promise<WikidataRow[]> {
  const body = await fetchUpstream({
    service: "Wikidata",
    url: `${OPEN_DATA.wikidata.url}?format=json&query=${encodeURIComponent(query)}`,
    init: { headers: { "User-Agent": OPEN_DATA.userAgent, Accept: "application/sparql-results+json" } },
    timeoutMs: OPEN_DATA.wikidata.timeoutMs,
    schema: answerSchema,
    retryOnRateLimit: true,
  })
  return body.results.bindings.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, cell]) => [key, cell.value])),
  )
}
