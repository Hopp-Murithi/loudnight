"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ROUTES, safeNextPath } from "@/config/site"
import { authApi } from "../api"

// A hard navigation after sign in or out makes the server render with the new session.
function useHardRedirect() {
  const router = useRouter()
  return (path: string) => {
    router.replace(path)
    router.refresh()
  }
}

const requestedPath = () => safeNextPath(new URLSearchParams(window.location.search).get("next"))

const checkEmailPath = (email: string, reason: "signup" | "reset" | "verify") =>
  `${ROUTES.checkEmail}?${new URLSearchParams({ email, reason })}`

export function useSignUp() {
  const router = useRouter()
  return useMutation({
    mutationFn: authApi.signUp,
    onSuccess: (_, input) => router.push(checkEmailPath(input.email, "signup")),
  })
}

export function useLogin() {
  const redirect = useHardRedirect()
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ redirectTo }) => redirect(requestedPath() ?? redirectTo),
  })
}

export function useLogout() {
  const redirect = useHardRedirect()
  return useMutation({ mutationFn: authApi.logout, onSuccess: ({ redirectTo }) => redirect(redirectTo) })
}

export function useResendVerification() {
  const router = useRouter()
  return useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: (_, input) => router.push(checkEmailPath(input.email, "verify")),
  })
}

export function useForgotPassword() {
  const router = useRouter()
  return useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (_, input) => router.push(checkEmailPath(input.email, "reset")),
  })
}

export function useSetPassword() {
  const redirect = useHardRedirect()
  return useMutation({ mutationFn: authApi.setPassword, onSuccess: ({ redirectTo }) => redirect(redirectTo) })
}

export function useUpdateAccount() {
  const router = useRouter()
  return useMutation({ mutationFn: authApi.updateAccount, onSuccess: () => router.refresh() })
}
