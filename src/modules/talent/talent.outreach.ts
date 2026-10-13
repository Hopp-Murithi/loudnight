import "server-only"
import { AI_MODELS } from "@/config/ai"
import { anthropic } from "@/lib/ai/client"
import {
  fallbackOutreach,
  fillOutreach,
  OUTREACH_SYSTEM,
  OUTREACH_TOOL,
  outreachSchema,
  outreachUserMessage,
  type OutreachBrief,
  type OutreachFacts,
} from "./talent.prompt"

const MAX_TOKENS = 2_400

async function drafts(brief: OutreachBrief): Promise<Map<string, string>> {
  try {
    const message = await anthropic().messages.create({
      model: AI_MODELS.copy,
      max_tokens: MAX_TOKENS,
      system: OUTREACH_SYSTEM,
      tools: [OUTREACH_TOOL],
      tool_choice: { type: "tool", name: OUTREACH_TOOL.name },
      messages: [{ role: "user", content: outreachUserMessage(brief) }],
    })
    const call = message.content.find((block) => block.type === "tool_use")
    const parsed = outreachSchema.safeParse(call?.input)
    return new Map(parsed.success ? parsed.data.messages.map((entry) => [entry.actId, entry.message]) : [])
  } catch {
    return new Map()
  }
}

// One message per act. A draft that carries its own numbers, or misses a marker, is replaced by the plain one,
// so the date, time and fee in every message are the venue's own.
export async function writeOutreach(brief: OutreachBrief, facts: OutreachFacts): Promise<Map<string, string>> {
  if (brief.acts.length === 0) return new Map()
  const written = await drafts(brief)
  return new Map(
    brief.acts.map((act) => {
      const filled = fillOutreach(written.get(act.actId) ?? "", facts)
      return [act.actId, filled ?? fallbackOutreach(act, brief, facts)]
    }),
  )
}
