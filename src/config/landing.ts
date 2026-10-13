// Landing page copy. Every Encore number here is a sample and is labelled as one on the page.

export const OWNER_QUESTION = "My bar in Brooklyn is empty every Tuesday. What should I run?"

export const GENERIC_IDEAS = ["Host a trivia night", "Try karaoke", "Run a happy hour special", "Book an open mic"]

export const SAMPLE_CONCEPT = {
  name: "Afrobeats Tuesdays",
  pitch: "Live afrobeats and West African street food, every week.",
  fit: 82,
  why: "Afrobeats is one of the strongest tastes within walking distance, and no venue nearby runs it on a Tuesday.",
} as const

export interface SampleReceipt {
  chip: string
  claim: string
  request: string
  response: string
}

// Shaped like a Qloo insights response, with made-up values. Real responses are never shown or stored in the repo.
export const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    chip: "Afrobeats, 0.94 affinity within 2 km",
    claim: "People within 2 km are far more into afrobeats than the average New Yorker.",
    request: "GET /v2/insights?filter.type=urn:tag&filter.tag.types=urn:tag:genre:music&signal.location.radius=2000",
    response: `{ "name": "Afrobeats", "type": "urn:tag:genre:music", "query": { "affinity": 0.94 } }`,
  },
  {
    chip: "West African food, a top local signal",
    claim: "West African food sits in the top tenth of dining tastes around the venue.",
    request: "GET /v2/insights?filter.type=urn:tag&filter.tag.types=urn:tag:cuisine&signal.location.radius=2000",
    response: `{ "name": "West African", "type": "urn:tag:cuisine", "query": { "affinity": 0.88 } }`,
  },
  {
    chip: "4 trivia nights nearby, none like this",
    claim: "Four venues within a mile already run trivia on Tuesdays. None run live afrobeats.",
    request: "GET /discovery/v2/events?latlong=40.71,-73.95&radius=1&unit=miles&classificationName=music",
    response: `{ "nearbyTuesdays": ["Trivia", "Trivia", "Trivia", "Trivia", "Comedy"], "afrobeats": 0 }`,
  },
]

export interface LoopStage {
  stage: string
  summary: string
  makes: string[]
}

// The four stages the brief names: decide, execute, promote, measure.
export const ENCORE_LOOP: LoopStage[] = [
  {
    stage: "Decide",
    summary: "Three nights nobody nearby runs, each with its receipts.",
    makes: ["Fit score from local taste", "Cost and break-even", "Why it beats what is on nearby"],
  },
  {
    stage: "Execute",
    summary: "A four-week series, so one good night becomes a habit.",
    makes: ["A twist each week", "Performers whose fans live nearby", "Menu specials"],
  },
  {
    stage: "Promote",
    summary: "One tap makes everything the night needs to fill up.",
    makes: ["Event page with RSVP and QR", "Poster and posts for each channel", "Ad brief"],
  },
  {
    stage: "Measure",
    summary: "Guests check in at the door, so turnout is counted, not guessed.",
    makes: ["Live count against break-even", "Keep, tweak or swap next week", "Results for each date"],
  },
]

// The brief's own example: 30 extra guests at $20 each, four Tuesdays a month, against a $49 to $99 plan.
export const NIGHT_VALUE_DEFAULTS = { guests: 30, spend: 20, nightsPerMonth: 4 } as const
export const PLAN_PRICE = { from: 49, to: 99 } as const
export const NIGHT_VALUE_LIMITS = {
  guests: { min: 5, max: 120, step: 5 },
  spend: { min: 5, max: 80, step: 1 },
} as const
