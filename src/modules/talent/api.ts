import { apiFetch } from "@/lib/http/client"

export const talentApi = {
  find: (seriesId: string) => apiFetch<{ found: number }>(`/series/${seriesId}/talent`, { method: "POST" }),
  editOutreach: (talentId: string, message: string) =>
    apiFetch<{ saved: true }>(`/talent/${talentId}`, { method: "PATCH", body: { message } }),
}
