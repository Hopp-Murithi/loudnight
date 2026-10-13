import { AI_MODELS } from "@/config/ai"
import { WEEKDAY_LABELS, type Weekday } from "@/config/venues"
import { cityOf } from "@/lib/address"
import { plainDashes } from "@/lib/text"

export { cityOf }

export const GENERIC_PROMPT_VERSION = "generic-2026-10-13"
const MAX_TOKENS = 900

export interface GenericVenue {
  name: string
  venueType: string
  address: string
  weekday: Weekday
}

// Only what a plain chatbot would be told: no Qloo, no gap scan, no tools. The contrast is the point.
export function genericRequest(venue: GenericVenue) {
  const night = WEEKDAY_LABELS[venue.weekday]
  return {
    model: AI_MODELS.reasoning,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: "user" as const,
        content: `I run a ${venue.venueType.replace("_", " ")} called ${venue.name} in ${cityOf(venue.address)}. ${night}s are always quiet. Suggest three event ideas to fill ${night} nights. Keep it short, in plain text with no formatting.`,
      },
    ],
  }
}

// Markdown emphasis and headings would show as stray symbols on screen, so they go.
export const tidyGenericAnswer = (text: string) =>
  plainDashes(text)
    .replace(/\*\*|__/g, "")
    .replace(/^#+\s*/gm, "")
    .trim()
    .slice(0, 8000)
