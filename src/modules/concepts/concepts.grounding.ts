import type { Receipt } from "@/modules/taste/taste.schemas"
import type { Candidate } from "./concepts.schemas"
import type { OverlapResult, Signal } from "./concepts.signals"

export type DropReason = "unknown source" | "no receipt" | "number not in receipt"

export interface GroundedClaim {
  label: string
  value: number
  receipt: Receipt
}

export interface Grounded {
  candidate: Candidate
  signals: Signal[]
  overlaps: OverlapResult[]
  claims: GroundedClaim[]
}

export interface GroundingResult {
  grounded: Grounded | null
  dropped: { label: string; reason: DropReason }[]
  rejected?: "one domain only" | "too few claims" | "unknown signal"
}

// The one display rule: affinities show to two decimals. Any number written in a label must equal that.
export const formatAffinity = (value: number) => value.toFixed(2)

const NUMBER = /\d+(?:\.\d+)?/g

// Digits inside a taste's own name ("2 Dope Queens") are part of the name, not a claim.
const withoutNames = (label: string, names: string[]) => names.reduce((text, name) => text.split(name).join(" "), label)

function resolve(source: string, signals: Map<string, Signal>, overlaps: Map<string, OverlapResult>) {
  if (source.startsWith("s")) {
    const signal = signals.get(source)
    return signal ? { value: signal.affinity, receipt: signal.receipt } : undefined
  }
  const overlap = overlaps.get(source)
  if (!overlap) return undefined
  return overlap.found && overlap.receipt && overlap.affinity !== null
    ? { value: overlap.affinity, receipt: overlap.receipt }
    : null
}

// The grounding rule in code: a claim keeps its place only when its receipt holds the value it shows.
export function groundCandidate(
  candidate: Candidate,
  signals: Map<string, Signal>,
  overlaps: Map<string, OverlapResult>,
): GroundingResult {
  const used = candidate.signalIds.map((id) => signals.get(id))
  if (used.some((signal) => !signal)) return { grounded: null, dropped: [], rejected: "unknown signal" }
  const usedSignals = used as Signal[]
  if (new Set(usedSignals.map((signal) => signal.category)).size < 2) {
    return { grounded: null, dropped: [], rejected: "one domain only" }
  }

  const names = [...signals.values()].map((signal) => signal.name).sort((a, b) => b.length - a.length)
  const dropped: GroundingResult["dropped"] = []
  const claims: GroundedClaim[] = []
  for (const claim of candidate.claims) {
    const found = resolve(claim.source, signals, overlaps)
    if (found === undefined) dropped.push({ label: claim.label, reason: "unknown source" })
    else if (found === null) dropped.push({ label: claim.label, reason: "no receipt" })
    else if (
      (withoutNames(claim.label, names).match(NUMBER) ?? []).some((shown) => shown !== formatAffinity(found.value))
    ) {
      dropped.push({ label: claim.label, reason: "number not in receipt" })
    } else claims.push({ label: claim.label, value: found.value, receipt: found.receipt })
  }

  if (claims.length < 2) return { grounded: null, dropped, rejected: "too few claims" }
  const cited = candidate.overlapIds.flatMap((id) => overlaps.get(id) ?? [])
  return { grounded: { candidate, signals: usedSignals, overlaps: cited, claims }, dropped }
}
