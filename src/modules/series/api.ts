import { apiFetch } from "@/lib/http/client"
import type { NightEditInput } from "./series.schemas"

export const seriesApi = {
  create: (conceptId: string) => apiFetch<{ seriesId: string }>(`/concepts/${conceptId}/series`, { method: "POST" }),
  updateNight: (nightId: string, input: NightEditInput) =>
    apiFetch<{ saved: true }>(`/nights/${nightId}`, { method: "PATCH", body: input }),
}
