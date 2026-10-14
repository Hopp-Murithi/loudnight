import { apiFetch } from "@/lib/http/client"
import type { AdDesign } from "./promote.schemas"

export const promoteApi = {
  saveDesign: (nightId: string, design: AdDesign) =>
    apiFetch<{ saved: true }>(`/nights/${nightId}/ad`, { method: "PUT", body: design }),
}
