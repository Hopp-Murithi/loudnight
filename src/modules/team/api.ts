import { apiFetch } from "@/lib/http/client"
import type { ChangeRoleInput, InviteInput, InviteResult } from "./team.schemas"

export const teamApi = {
  invite: (venueId: string, input: InviteInput) =>
    apiFetch<InviteResult>(`/venues/${venueId}/members`, { method: "POST", body: input }),
  changeRole: (venueId: string, userId: string, input: ChangeRoleInput) =>
    apiFetch<{ saved: true }>(`/venues/${venueId}/members/${userId}`, { method: "PATCH", body: input }),
  remove: (venueId: string, userId: string) =>
    apiFetch<{ removed: true }>(`/venues/${venueId}/members/${userId}`, { method: "DELETE" }),
}
