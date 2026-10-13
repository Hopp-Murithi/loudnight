import { z } from "zod"

// Where a number came from: the cache row and the key path the evidence receipt trigger reads with `#>>`.
export const receiptSchema = z.object({ cacheId: z.uuid(), path: z.array(z.string()).min(1).max(12) })

export const tasteItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  affinity: z.number(),
  score: z.number().min(0).max(1),
  popularity: z.number().nullable(),
  receipt: receiptSchema,
})

export const domainStatusSchema = z.enum(["ok", "empty", "failed"])

export const tasteDomainResultSchema = z.object({
  domain: z.string(),
  label: z.string(),
  status: domainStatusSchema,
  items: z.array(tasteItemSchema),
})

export const leanSchema = z.object({ key: z.string(), label: z.string(), value: z.number(), receipt: receiptSchema })

export const audienceSkewSchema = z.object({
  basedOn: z.array(z.object({ id: z.string(), name: z.string() })),
  age: z.array(leanSchema),
  gender: z.array(leanSchema),
})

export const tasteFingerprintSchema = z.object({
  domains: z.array(tasteDomainResultSchema),
  audience: audienceSkewSchema.nullable(),
})

export type Receipt = z.infer<typeof receiptSchema>
export type TasteItem = z.infer<typeof tasteItemSchema>
export type DomainStatus = z.infer<typeof domainStatusSchema>
export type TasteDomainResult = z.infer<typeof tasteDomainResultSchema>
export type Lean = z.infer<typeof leanSchema>
export type AudienceSkew = z.infer<typeof audienceSkewSchema>
export type TasteFingerprint = z.infer<typeof tasteFingerprintSchema>
