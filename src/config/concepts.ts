// Words that mean the same kind of night, so "pub quiz" counts as covered when four bars run "Trivia".
export const THEME_SYNONYMS: readonly (readonly string[])[] = [
  ["trivia", "quiz"],
  ["comedy", "stand-up", "standup", "open mic"],
  ["karaoke", "sing-along", "singalong"],
  ["dj", "dance", "club", "disco"],
  ["live music", "concert", "gig", "band", "showcase"],
  ["film", "movie", "screening", "cinema"],
  ["sports", "game day", "watch party"],
  ["drag", "cabaret"],
  ["jazz", "blues"],
]

// Covered themes that describe no programme at all, so they never make a concept look stale.
export const NON_THEMES = ["drinks, no programme"]

export const THEME_STOPWORDS = [
  "night",
  "nights",
  "live",
  "music",
  "with",
  "and",
  "the",
  "show",
  "party",
  "evening",
  "weekly",
]

// The planner's budget for one run of step 4.
export const CONCEPT_AGENT = {
  maxTurns: 10,
  maxToolCalls: 18,
  maxTokens: 6_000,
} as const

export const CONCEPT_FORMAT_LABELS: Record<string, string> = {
  live_music: "Live music",
  dj_night: "DJ night",
  screening: "Screening",
  food_and_drink: "Food and drink",
  talk: "Talk",
  game: "Games",
  workshop: "Workshop",
  other: "Night out",
}

// How each part of the score is shown: points earned out of its weight in the formula.
export const SCORE_PARTS = [
  { key: "audienceFit", label: "Audience fit", weight: 40, hint: "How much nearby fans of one taste love the other" },
  { key: "novelty", label: "Freshness", weight: 20, hint: "How little of this already runs nearby" },
  { key: "venueFit", label: "Venue fit", weight: 20, hint: "What the night needs that your room has" },
  { key: "costFit", label: "Cost fit", weight: 20, hint: "The cost against your talent budget" },
] as const
