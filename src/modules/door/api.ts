import { apiFetch } from "@/lib/http/client"
import type { CheckinInput, CheckinResult, DoorView } from "./door.schemas"

export const doorApi = {
  read: (nightId: string) => apiFetch<DoorView>(`/nights/${nightId}/door`),
  checkIn: (nightId: string, input: CheckinInput) =>
    apiFetch<CheckinResult>(`/nights/${nightId}/checkins`, { method: "POST", body: input }),
  logSpend: (nightId: string, amount: number) =>
    apiFetch<{ saved: true }>(`/nights/${nightId}/spend`, { method: "PUT", body: { amount } }),
}
