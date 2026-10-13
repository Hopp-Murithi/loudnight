import "server-only"
import { QLOO } from "@/config/integrations"
import { anthropic } from "@/lib/ai/client"
import { mapWithLimit } from "@/lib/concurrency"
import { overlapRequest } from "@/lib/qloo/requests"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { GapScan } from "@/modules/gap/gap.schemas"
import { atStep, withStep, type StepContext } from "@/modules/runs/runs.steps"
import type { TasteFingerprint } from "@/modules/taste/taste.schemas"
import { cachedQloo, type Neighbourhood } from "@/modules/taste/taste.service"
import { runConceptAgent } from "./concepts.agent"
import { groundCandidate, type Grounded } from "./concepts.grounding"
import { conceptsUserMessage, CONCEPTS_PROMPT_VERSION, type VenueBrief } from "./concepts.prompt"
import { conceptsRepository } from "./concepts.repository"
import { SHORTLIST_SIZE, type Candidate } from "./concepts.schemas"
import { audienceFit, costFit, novelty, totalScore, venueFit, type SubScores } from "./concepts.scoring"
import { buildSignals, readOverlap, type OverlapResult, type Signal } from "./concepts.signals"

export interface PlanningInput {
  admin: AdminSupabase
  runId: string
  venueId: string
  area: Neighbourhood
  venue: VenueBrief
  fingerprint: TasteFingerprint
  gap: GapScan
  trace?: StepContext
}

export interface PlanningSummary {
  candidates: number
  stored: number
  shortlisted: number
  dropped: { claim: string; reason: string }[]
  rejected: { name: string; reason: string }[]
}

function overlapChecker(admin: AdminSupabase, area: Neighbourhood, trace?: StepContext) {
  let next = 0
  return (anchor: Signal, targets: Signal[]) =>
    mapWithLimit(targets, QLOO.maxConcurrent, async (target) => {
      const id = `o${(next += 1)}`
      const request = overlapRequest(anchor, target, area.point)
      const answer = await withStep(
        trace,
        "qloo.overlap",
        { anchor: anchor.name, target: target.name, path: request.path },
        () => cachedQloo(admin, request),
        (cached) => ({ summary: { overlapId: id, fromCache: cached.fromCache }, cacheId: cached.cacheId }),
      )
      return readOverlap(answer.response, answer.cacheId, { id, anchorId: anchor.id, target })
    })
}

function score(grounded: Grounded, input: PlanningInput): SubScores {
  const { candidate } = grounded
  return {
    audienceFit: audienceFit(grounded.overlaps),
    novelty: novelty(candidate.themes, input.gap.themes, input.gap.noveltyNeutral),
    venueFit: venueFit(candidate.needs, input.venue.capabilities, candidate.expectedAudience, input.venue.capacity),
    costFit: costFit(candidate.estimatedCostCents, input.venue.talentBudgetCents),
  }
}

export interface Invention {
  candidates: Candidate[]
  overlaps: OverlapResult[]
  turns: number
  toolCalls: number
}

// Step 4: six nights from the fingerprint, each combination checked with Qloo. Serialisable, for the next step.
export async function inventConcepts(input: PlanningInput): Promise<Invention> {
  const signals = buildSignals(input.fingerprint)
  const generating = atStep(input.trace, "generate_concepts")
  const outcome = await withStep(
    generating,
    "planner.concepts",
    { prompt: CONCEPTS_PROMPT_VERSION, signals: signals.length, coveredThemes: input.gap.themes.length },
    () =>
      runConceptAgent(conceptsUserMessage(input.venue, signals, input.gap.themes), signals, {
        create: (params) => anthropic().messages.create(params),
        checkOverlap: overlapChecker(input.admin, input.area, generating),
      }),
    (result) => ({
      summary: {
        candidates: result.candidates.length,
        turns: result.turns,
        toolCalls: result.toolCalls,
        stop: result.stop,
      },
    }),
  )
  return { ...outcome, overlaps: [...outcome.overlaps.values()] }
}

// Step 5: keep only grounded claims, score from receipts and settings, store the six and shortlist three.
export function scoreConcepts(input: PlanningInput, invention: Invention): Promise<PlanningSummary> {
  return withStep(
    atStep(input.trace, "score"),
    "encore.score",
    { candidates: invention.candidates.length },
    () => groundScoreAndStore(input, buildSignals(input.fingerprint), invention),
    (summary) => ({ summary: { ...summary } }),
  )
}

export async function generateConcepts(input: PlanningInput): Promise<PlanningSummary> {
  return scoreConcepts(input, await inventConcepts(input))
}

async function groundScoreAndStore(
  input: PlanningInput,
  signals: Signal[],
  invention: Invention,
): Promise<PlanningSummary> {
  const bySignal = new Map(signals.map((signal) => [signal.id, signal]))
  const overlaps = new Map(invention.overlaps.map((overlap) => [overlap.id, overlap]))
  const results = invention.candidates.map((candidate) => ({
    candidate,
    ...groundCandidate(candidate, bySignal, overlaps),
  }))
  const kept = results.flatMap((result) => (result.grounded ? [result.grounded] : []))
  const ranked = kept
    .map((grounded) => ({ grounded, scores: score(grounded, input) }))
    .sort((a, b) => totalScore(b.scores) - totalScore(a.scores) || b.scores.audienceFit - a.scores.audienceFit)

  const stored = await conceptsRepository.insertConcepts(
    input.admin,
    ranked.map(({ grounded: { candidate }, scores }, index) => ({
      run_id: input.runId,
      venue_id: input.venueId,
      rank: index + 1,
      is_shortlisted: index < SHORTLIST_SIZE,
      name: candidate.name,
      pitch: candidate.pitch,
      reason_beats_nearby: candidate.reasonBeatsNearby,
      audience_fit: scores.audienceFit,
      novelty: scores.novelty,
      venue_fit: scores.venueFit,
      cost_fit: scores.costFit,
      estimated_cost_cents: candidate.estimatedCostCents,
      format: candidate.format,
      needs: candidate.needs,
      themes: candidate.themes,
      expected_audience: candidate.expectedAudience,
    })),
  )
  const idByRank = new Map(stored.map((row) => [row.rank, row.id]))
  await conceptsRepository.insertEvidence(
    input.admin,
    ranked.flatMap(({ grounded }, index) =>
      grounded.claims.map((claim) => ({
        concept_id: idByRank.get(index + 1) ?? "",
        venue_id: input.venueId,
        qloo_cache_id: claim.receipt.cacheId,
        claim: claim.label,
        value: claim.value,
        response_path: claim.receipt.path,
      })),
    ),
  )

  return {
    candidates: invention.candidates.length,
    stored: stored.length,
    shortlisted: Math.min(SHORTLIST_SIZE, stored.length),
    dropped: results.flatMap((result) => result.dropped.map((drop) => ({ claim: drop.label, reason: drop.reason }))),
    rejected: results.flatMap((result) =>
      result.rejected ? [{ name: result.candidate.name, reason: result.rejected }] : [],
    ),
  }
}
