// Orchestration and concept reasoning need the stronger model; bulk copy runs on the fast one.
export const AI_MODELS = {
  reasoning: "claude-sonnet-5-5",
  copy: "claude-haiku-5-5",
} as const

export const AI_TIMEOUT_MS = 60_000
