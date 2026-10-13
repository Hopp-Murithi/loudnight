import { z } from "zod"
import { VENUE_CAPABILITIES } from "@/config/venues"
import { plainDashes } from "@/lib/text"

export const CONCEPT_FORMATS = [
  "live_music",
  "dj_night",
  "screening",
  "food_and_drink",
  "talk",
  "game",
  "workshop",
  "other",
] as const

export const CANDIDATE_COUNT = 6
export const SHORTLIST_SIZE = 3

const clip = (max: number) => z.string().transform((text) => plainDashes(text).trim().slice(0, max))

// A claim cites a signal or an overlap result by id. Its label is words; the value comes from the receipt.
export const claimSchema = z
  .object({ label: clip(90).pipe(z.string().min(3)), source: z.string().regex(/^[so]\d+$/) })
  .strict()

export const candidateSchema = z
  .object({
    name: clip(80).pipe(z.string().min(3)),
    pitch: clip(200).pipe(z.string().min(10)),
    reasonBeatsNearby: clip(300).pipe(z.string().min(10)),
    signalIds: z
      .array(z.string().regex(/^s\d+$/))
      .min(2)
      .max(3),
    overlapIds: z
      .array(z.string().regex(/^o\d+$/))
      .min(1)
      .max(4),
    claims: z.array(claimSchema).min(2).max(4),
    format: z.enum(CONCEPT_FORMATS),
    needs: z.array(z.enum(VENUE_CAPABILITIES)).max(6),
    themes: z.array(clip(40)).min(1).max(3),
    expectedAudience: z.number().int().min(5).max(5000),
    estimatedCostCents: z.number().int().min(0).max(10_000_000),
  })
  .strict()

export const submissionSchema = z.object({ candidates: z.array(candidateSchema).min(1).max(CANDIDATE_COUNT) }).strict()

export const checkOverlapSchema = z
  .object({
    anchorSignalId: z.string().regex(/^s\d+$/),
    targetSignalIds: z
      .array(z.string().regex(/^s\d+$/))
      .min(1)
      .max(3),
  })
  .strict()

export type Candidate = z.infer<typeof candidateSchema>
export type ConceptFormat = (typeof CONCEPT_FORMATS)[number]

export interface ConceptEvidence {
  id: string
  claim: string
  value: number
}

// The card's read model, built from the concepts and evidence the caller may see under RLS.
export interface ConceptView {
  id: string
  rank: number
  name: string
  pitch: string
  reasonBeatsNearby: string
  format: ConceptFormat
  scores: { audienceFit: number; novelty: number; venueFit: number; costFit: number; total: number }
  estimatedCostCents: number
  chosen: boolean
  evidence: ConceptEvidence[]
}

export interface ReceiptView {
  claim: string
  value: number | null
  resultCount?: number
  endpoint: string
  params: Record<string, unknown>
  fetchedAt: string
  slice: unknown
  highlight: string[]
}
