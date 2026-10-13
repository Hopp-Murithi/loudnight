import "server-only"
import { AI_MODELS } from "@/config/ai"
import { anthropic } from "@/lib/ai/client"
import { upstreamFailed } from "@/lib/http/errors"
import { THEMES_SYSTEM, THEMES_TOOL, themesUserMessage } from "./gap.prompt"
import { themesSchema, type CoveredTheme, type NearbyEvent, type NearbyVenue } from "./gap.schemas"

const MAX_TOKENS = 1_200

// One forced tool call, checked against a strict schema. Anything else the model says is ignored.
export async function coveredThemes(
  weekday: string,
  venues: NearbyVenue[],
  events: NearbyEvent[],
): Promise<CoveredTheme[]> {
  if (venues.length === 0 && events.length === 0) return []
  const message = await anthropic().messages.create({
    model: AI_MODELS.copy,
    max_tokens: MAX_TOKENS,
    system: THEMES_SYSTEM,
    tools: [THEMES_TOOL],
    tool_choice: { type: "tool", name: THEMES_TOOL.name },
    messages: [{ role: "user", content: themesUserMessage(weekday, venues, events) }],
  })
  const call = message.content.find((block) => block.type === "tool_use")
  const parsed = themesSchema.safeParse(call?.input)
  if (!parsed.success) throw upstreamFailed("The planner")
  return parsed.data.themes
}
