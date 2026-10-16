"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { teamApi } from "../api"
import type { ChangeRoleInput, InviteInput } from "../team.schemas"

const INVITE_TOASTS = {
  invited: (email: string) => `Invitation sent to ${email}`,
  added: (email: string) => `${email} added to the team`,
  resent: (email: string) => `A new sign-in link was sent to ${email}`,
}

export function useInvite(venueId: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: (input: InviteInput) => teamApi.invite(venueId, input),
    onSuccess: ({ status }, input) => {
      toast.success(INVITE_TOASTS[status](input.email))
      router.refresh()
    },
  })
}

export function useChangeRole(venueId: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: ({ userId, ...input }: ChangeRoleInput & { userId: string }) =>
      teamApi.changeRole(venueId, userId, input),
    onSuccess: () => {
      toast.success("Role changed")
      router.refresh()
    },
  })
}

export function useRemoveMember(venueId: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: (userId: string) => teamApi.remove(venueId, userId),
    onSuccess: () => {
      toast.success("Removed from the team")
      router.refresh()
    },
  })
}
