export const ACT_KINDS = ["musician", "dj", "comedian", "poet", "speaker", "other"] as const
export type ActKind = (typeof ACT_KINDS)[number]

export interface Verdict {
  home: string | null
  star: boolean
  kind: ActKind
}

const PERFORMERS: ActKind[] = ["musician", "dj", "comedian", "poet", "speaker"]
const KINDS_BY_FORMAT: Record<string, ActKind[]> = {
  live_music: ["musician"],
  dj_night: ["dj", "musician"],
  talk: ["speaker", "poet", "comedian"],
}

// Which kinds of act a night can book: musicians for music, DJs for a DJ night, and any live performer otherwise.
export const kindsFor = (format: string): ActKind[] => KINDS_BY_FORMAT[format] ?? PERFORMERS

// The acts a venue can really book, home-grown first. Household names and anyone who is not the right kind of
// performer are left out. Without verdicts (the check failed), the list stays in the order it came.
export function fitActs<T extends { name: string }>(
  acts: T[],
  verdicts: Map<string, Verdict>,
  country: string | null,
  format: string,
  keep: number,
): (T & { home: string | null })[] {
  if (verdicts.size === 0) return acts.slice(0, keep).map((act) => ({ ...act, home: null }))
  const allowed = kindsFor(format)
  const rank = (home: string | null) => (country && home === country ? 0 : home === null ? 1 : 2)
  return acts
    .map((act, order) => ({ act, order, verdict: verdicts.get(act.name) }))
    .filter(({ verdict }) => !verdict || (!verdict.star && allowed.includes(verdict.kind)))
    .sort((a, b) => rank(a.verdict?.home ?? null) - rank(b.verdict?.home ?? null) || a.order - b.order)
    .slice(0, keep)
    .map(({ act, verdict }) => ({ ...act, home: verdict?.home ?? null }))
}
