import { NON_THEMES, THEME_STOPWORDS, THEME_SYNONYMS } from "@/config/concepts"
import type { CoveredTheme } from "@/modules/gap/gap.schemas"
import type { OverlapResult } from "./concepts.signals"

export interface SubScores {
  audienceFit: number
  novelty: number
  venueFit: number
  costFit: number
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))
const round3 = (value: number) => Math.round(clamp(value) * 1000) / 1000

// The database's formula, mirrored only to rank before storing. The stored total always comes from Postgres.
export const totalScore = ({ audienceFit, novelty, venueFit, costFit }: SubScores) =>
  Math.round(40 * audienceFit + 20 * novelty + 20 * venueFit + 20 * costFit)

// How strongly fans of one signal like the others, near this venue. A target Qloo did not return counts as zero.
export function audienceFit(overlaps: OverlapResult[]): number {
  if (overlaps.length === 0) return 0
  return round3(
    overlaps.reduce((sum, overlap) => sum + (overlap.found ? (overlap.affinity ?? 0) : 0), 0) / overlaps.length,
  )
}

// Hyphens split and simple plurals fold, so "songwriters in the round" meets "Singer-songwriter showcase".
const stem = (word: string) => (word.length > 4 && word.endsWith("s") ? word.slice(0, -1) : word)
const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !THEME_STOPWORDS.includes(word))
    .map(stem)

const group = (text: string) =>
  THEME_SYNONYMS.findIndex((terms) => terms.some((term) => text.toLowerCase().includes(term)))

export function themeIsCovered(theme: string, covered: CoveredTheme[]): boolean {
  const mine = new Set(words(theme))
  const myGroup = group(theme)
  return covered
    .filter((entry) => !NON_THEMES.includes(entry.theme.toLowerCase()))
    .some(
      (entry) => (myGroup >= 0 && group(entry.theme) === myGroup) || words(entry.theme).some((word) => mine.has(word)),
    )
}

// One minus the share of the concept's themes that something nearby already runs. Neutral when the scan failed.
export function novelty(themes: string[], covered: CoveredTheme[], neutral: boolean): number {
  if (neutral) return 0.5
  if (themes.length === 0) return 0.5
  return round3(1 - themes.filter((theme) => themeIsCovered(theme, covered)).length / themes.length)
}

// Share of what the night needs that the room has, scaled down when the expected crowd outgrows it.
export function venueFit(needs: string[], capabilities: string[], expectedAudience: number, capacity: number): number {
  const has = needs.length === 0 ? 1 : needs.filter((need) => capabilities.includes(need)).length / needs.length
  const room = expectedAudience <= capacity ? 1 : capacity / expectedAudience
  return round3(has * room)
}

// Full marks within budget, falling to zero at twice the budget.
export function costFit(costCents: number, budgetCents: number): number {
  if (costCents <= budgetCents) return 1
  if (budgetCents <= 0) return 0
  return round3(2 - costCents / budgetCents)
}
