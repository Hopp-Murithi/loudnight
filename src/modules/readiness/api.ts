import { apiFetch } from "@/lib/http/client"
import type { ChecklistInput } from "./readiness.build"

export const readinessApi = {
  saveChecklist: (nightId: string, input: ChecklistInput) =>
    apiFetch<{ saved: true }>(`/nights/${nightId}/checklist`, { method: "PUT", body: input }),
}
