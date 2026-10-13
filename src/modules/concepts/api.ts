import { apiFetch } from "@/lib/http/client"
import type { ConceptView, ReceiptView } from "./concepts.schemas"

export const conceptsApi = {
  shortlist: (runId: string) => apiFetch<ConceptView[]>(`/runs/${runId}/concepts`),
  receipt: (evidenceId: string) => apiFetch<ReceiptView>(`/receipts/${evidenceId}`),
  callReceipt: (stepId: string) => apiFetch<ReceiptView>(`/run-steps/${stepId}/receipt`),
  choose: (conceptId: string) => apiFetch<{ chosen: true }>(`/concepts/${conceptId}/choose`, { method: "POST" }),
}
