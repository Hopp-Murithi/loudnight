import "server-only"
import { AI_MODELS } from "@/config/ai"
import { FALLBACK_VARIATIONS } from "@/config/series"
import { anthropic } from "@/lib/ai/client"
import { VARIATIONS_SYSTEM, VARIATIONS_TOOL, variationsUserMessage, type VariationBrief } from "./series.prompt"
import { variationsSchema } from "./series.schemas"

const MAX_TOKENS = 600

// One forced tool call, checked for four distinct twists with no numbers. A series is never blocked by the
// copywriter: if it fails the check or does not answer, the plain fallback twists are used instead.
export async function writeVariations(brief: VariationBrief): Promise<string[]> {
  try {
    const message = await anthropic().messages.create({
      model: AI_MODELS.copy,
      max_tokens: MAX_TOKENS,
      system: VARIATIONS_SYSTEM,
      tools: [VARIATIONS_TOOL],
      tool_choice: { type: "tool", name: VARIATIONS_TOOL.name },
      messages: [{ role: "user", content: variationsUserMessage(brief) }],
    })
    const call = message.content.find((block) => block.type === "tool_use")
    const parsed = variationsSchema.safeParse(call?.input)
    return parsed.success ? parsed.data.variations : [...FALLBACK_VARIATIONS]
  } catch {
    return [...FALLBACK_VARIATIONS]
  }
}
