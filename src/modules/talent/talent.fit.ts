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

// A list for a venue's own country: once there are enough home-grown acts, or the night is about the country itself,
// acts from elsewhere are left out; otherwise a couple may fill in, after the home-grown ones.
export function homeGrownFirst<T extends { home: string | null }>(
  acts: T[],
  country: string | null,
  nightIsAboutCountry: boolean,
  enough = 4,
  foreignAllowed = 2,
): T[] {
  if (!country) return acts
  const foreign = (act: T) => act.home !== null && act.home !== country
  const homeGrown = acts.filter((act) => act.home === country).length
  if (nightIsAboutCountry || homeGrown >= enough) return acts.filter((act) => !foreign(act))
  let kept = 0
  return acts.filter((act) => !foreign(act) || kept++ < foreignAllowed)
}

// Whether a night's name or pitch names the venue's country, such as "Underrated Kenya Open Stage" in Kenya.
export const aboutCountry = (text: string, countryName: string) =>
  countryName.length >= 4 &&
  text.toLowerCase().includes(countryName.slice(0, Math.max(4, countryName.length - 1)).toLowerCase())
