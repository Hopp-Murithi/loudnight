import { apiFetch } from "@/lib/http/client"
import type { TalentEditInput } from "@/modules/series/series.schemas"

export const talentApi = {
  find: (seriesId: string) => apiFetch<{ found: number }>(`/series/${seriesId}/talent`, { method: "POST" }),
  update: (talentId: string, input: TalentEditInput) =>
    apiFetch<{ saved: true }>(`/talent/${talentId}`, { method: "PATCH", body: input }),
}
