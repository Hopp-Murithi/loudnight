import { z } from "zod"

// Only the fields Encore reads are checked. Loose objects keep everything else, so the stored response stays whole.
const affinityQuery = z.looseObject({ affinity: z.number() })
// Some entity tags arrive with only a type (seen on artists), so id and name are optional here.
const tagRef = z.looseObject({ id: z.string().optional(), name: z.string().optional(), type: z.string() })

export const qlooEntitySchema = z.looseObject({
  entity_id: z.string(),
  name: z.string(),
  popularity: z.number().nullish(),
  location: z.looseObject({ lat: z.number(), lon: z.number() }).optional(),
  tags: z.array(tagRef).optional(),
  query: affinityQuery.optional(),
})

export const qlooTagSchema = z.looseObject({
  tag_id: z.string(),
  name: z.string(),
  subtype: z.string().optional(),
  popularity: z.number().nullish(),
  query: affinityQuery,
})

const lean = z.record(z.string(), z.number())

export const qlooAudienceSchema = z.looseObject({
  entity_id: z.string(),
  query: z.looseObject({ age: lean.optional(), gender: lean.optional() }),
})

export const qlooHeatCellSchema = z.looseObject({
  location: z.looseObject({ latitude: z.number(), longitude: z.number(), geohash: z.string() }),
  query: z.looseObject({ affinity: z.number(), affinity_rank: z.number().optional() }),
})

export const qlooInsightsSchema = z.looseObject({
  success: z.boolean().optional(),
  results: z
    .looseObject({
      entities: z.array(qlooEntitySchema).optional(),
      tags: z.array(qlooTagSchema).optional(),
      demographics: z.array(qlooAudienceSchema).optional(),
      heatmap: z.array(qlooHeatCellSchema).optional(),
    })
    .optional(),
})

export const qlooSearchSchema = z.looseObject({
  results: z.array(z.looseObject({ entity_id: z.string(), name: z.string(), popularity: z.number().optional() })),
})

export const qlooTagLookupSchema = z.looseObject({
  results: z.looseObject({
    tags: z.array(z.looseObject({ id: z.string(), name: z.string(), type: z.string() })),
  }),
})

export type QlooInsights = z.infer<typeof qlooInsightsSchema>
export type QlooEntity = z.infer<typeof qlooEntitySchema>
export type QlooTag = z.infer<typeof qlooTagSchema>

// Qloo answers 200 with empty lists when a parameter does not apply, so "no data here" is not an error.
export function isEmptyInsight(response: QlooInsights): boolean {
  const results = response.results
  if (!results) return true
  return [results.entities, results.tags, results.demographics, results.heatmap].every((list) => !list?.length)
}
