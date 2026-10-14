import type Anthropic from "@anthropic-ai/sdk"
import { AI_MODELS } from "@/config/ai"
import { CONCEPT_AGENT } from "@/config/concepts"
import { CHECK_OVERLAP_TOOL, CONCEPTS_SYSTEM, SUBMIT_TOOL } from "./concepts.prompt"
import { CANDIDATE_COUNT, candidateSchema, checkOverlapSchema, type Candidate } from "./concepts.schemas"
import type { OverlapResult, Signal } from "./concepts.signals"

type Message = Anthropic.Messages.Message
type MessageParam = Anthropic.Messages.MessageParam
type ToolResult = Anthropic.Messages.ToolResultBlockParam

export interface AgentDeps {
  create: (params: Anthropic.Messages.MessageCreateParamsNonStreaming) => Promise<Message>
  checkOverlap: (anchor: Signal, targets: Signal[]) => Promise<OverlapResult[]>
}

export interface AgentOutcome {
  candidates: Candidate[]
  overlaps: Map<string, OverlapResult>
  turns: number
  toolCalls: number
  stop: "submitted" | "budget"
}

const result = (id: string, content: unknown, isError = false): ToolResult => ({
  type: "tool_result",
  tool_use_id: id,
  content: typeof content === "string" ? content : JSON.stringify(content),
  is_error: isError,
})

// Validates each candidate on its own, so one bad night does not throw away five good ones.
function readSubmission(input: unknown) {
  const raw = (input as { candidates?: unknown })?.candidates
  const list = Array.isArray(raw) ? raw : []
  const checked = list.map((candidate) => candidateSchema.safeParse(candidate))
  const valid = checked.flatMap((check) => (check.success ? [check.data] : []))
  const problems = checked.flatMap((check, index) =>
    check.success
      ? []
      : [`candidate ${index + 1}: ${check.error.issues.map((issue) => issue.path.join(".")).join(", ")}`],
  )
  return { valid, problems }
}

// Step 4's tool loop. The model chooses which overlaps to check; Loudnight runs every call and keeps the receipts.
export async function runConceptAgent(userMessage: string, signals: Signal[], deps: AgentDeps): Promise<AgentOutcome> {
  const byId = new Map(signals.map((signal) => [signal.id, signal]))
  const overlaps = new Map<string, OverlapResult>()
  const messages: MessageParam[] = [{ role: "user", content: userMessage }]
  let toolCalls = 0

  for (let turn = 1; turn <= CONCEPT_AGENT.maxTurns; turn += 1) {
    const lastTurn = turn === CONCEPT_AGENT.maxTurns || toolCalls >= CONCEPT_AGENT.maxToolCalls
    const reply = await deps.create({
      model: AI_MODELS.reasoning,
      max_tokens: CONCEPT_AGENT.maxTokens,
      system: CONCEPTS_SYSTEM,
      // The reasoning model refuses a forced tool, so the last turn offers only the submit tool instead.
      tools: lastTurn ? [SUBMIT_TOOL] : [CHECK_OVERLAP_TOOL, SUBMIT_TOOL],
      tool_choice: { type: "auto" },
      messages,
    })
    messages.push({ role: "assistant", content: reply.content })
    const uses = reply.content.filter((block) => block.type === "tool_use")
    if (uses.length === 0) {
      messages.push({ role: "user", content: `Call ${SUBMIT_TOOL.name} with all ${CANDIDATE_COUNT} candidates.` })
      continue
    }

    const submission = uses.find((use) => use.name === SUBMIT_TOOL.name)
    if (submission) {
      toolCalls += 1
      const { valid, problems } = readSubmission(submission.input)
      if (problems.length === 0 || lastTurn)
        return { candidates: valid, overlaps, turns: turn, toolCalls, stop: "submitted" }
    }
    // Every check in a turn runs at once; the Qloo calls inside are still capped by the shared concurrency limit.
    const results: ToolResult[] = await Promise.all(
      uses.map(async (use): Promise<ToolResult> => {
        if (use.name === SUBMIT_TOOL.name) {
          const { problems } = readSubmission(use.input)
          return result(use.id, `Fix and resubmit all candidates. Invalid fields: ${problems.join("; ")}`, true)
        }
        toolCalls += 1
        const args = checkOverlapSchema.safeParse(use.input)
        const anchor = args.success ? byId.get(args.data.anchorSignalId) : undefined
        const targets = args.success ? args.data.targetSignalIds.flatMap((id) => byId.get(id) ?? []) : []
        if (!anchor || targets.length === 0 || toolCalls > CONCEPT_AGENT.maxToolCalls) {
          return result(use.id, "Use signal ids from the data block, and stay within the tool budget.", true)
        }
        const found = await deps.checkOverlap(anchor, targets).catch(() => null)
        if (!found) return result(use.id, "Qloo did not answer this check. Try other signals.", true)
        found.forEach((overlap) => overlaps.set(overlap.id, overlap))
        return result(
          use.id,
          found.map((overlap) => ({
            overlapId: overlap.id,
            anchor: anchor.name,
            target: byId.get(overlap.targetId)?.name,
            confirmed: overlap.found,
            rankInCategory: overlap.rank,
          })),
        )
      }),
    )
    messages.push({ role: "user", content: results })
  }
  return { candidates: [], overlaps, turns: CONCEPT_AGENT.maxTurns, toolCalls, stop: "budget" }
}
