import "server-only"
import Anthropic from "@anthropic-ai/sdk"
import { AI_TIMEOUT_MS } from "@/config/ai"
import { aiEnv } from "@/lib/env/server"

let client: Anthropic | undefined

// One client per server process, created on first use so pages without AI never need the key.
export function anthropic(): Anthropic {
  client ??= new Anthropic({ apiKey: aiEnv().ANTHROPIC_API_KEY, maxRetries: 2, timeout: AI_TIMEOUT_MS })
  return client
}

// The API's own messages can name internals, so callers get a plain sentence instead.
export function aiFailureReason(error: unknown): string {
  if (error instanceof Anthropic.RateLimitError) return "The planner is busy. Try again in a few minutes."
  if (error instanceof Anthropic.AuthenticationError) return "The planner is not set up correctly."
  if (error instanceof Anthropic.APIConnectionTimeoutError) return "The planner took too long to answer."
  if (error instanceof Anthropic.APIError) return "The planner could not complete the request."
  return "The request could not be completed."
}
