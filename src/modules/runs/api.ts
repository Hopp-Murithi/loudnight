import { apiFetch, apiStream } from "@/lib/http/client"
import type { PipelineStep } from "@/config/runs"
import type { RunEvent, RunView } from "./runs.schemas"

export const runsApi = {
  start: (venueId: string) =>
    apiFetch<{ encoreId: string; genericId: string }>(`/venues/${venueId}/runs`, { method: "POST" }),
  view: (runId: string) => apiFetch<RunView>(`/runs/${runId}`),
  step: (runId: string, step: PipelineStep, onEvent: (event: RunEvent) => void, signal?: AbortSignal) =>
    apiStream<RunEvent>(`/runs/${runId}/steps/${step}`, {}, onEvent, signal),
  generic: (runId: string) => apiFetch<{ answer: string }>(`/runs/${runId}/generic`, { method: "POST" }),
}
