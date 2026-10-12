// Upstream services the planning pipeline calls. Exact Qloo parameters are confirmed in plan 02's API test.
export const QLOO = {
  defaultUrl: "https://hackathon.api.qloo.com",
  cacheTtlDays: 7,
  timeoutMs: 15_000,
} as const

export const GOOGLE_PLACES = {
  url: "https://places.googleapis.com/v1",
  timeoutMs: 10_000,
} as const

export const TICKETMASTER = {
  url: "https://app.ticketmaster.com/discovery/v2",
  timeoutMs: 10_000,
} as const
