import { apiFetch } from "@/lib/http/client"
import type {
  EmailOnlyInput,
  LoginInput,
  RedirectResult,
  SentResult,
  SetPasswordInput,
  SignUpInput,
  UpdateAccountInput,
} from "./auth.schemas"

export const authApi = {
  signUp: (input: SignUpInput) => apiFetch<SentResult>("/auth/signup", { method: "POST", body: input }),
  login: (input: LoginInput) => apiFetch<RedirectResult>("/auth/login", { method: "POST", body: input }),
  logout: () => apiFetch<RedirectResult>("/auth/logout", { method: "POST" }),
  resendVerification: (input: EmailOnlyInput) =>
    apiFetch<SentResult>("/auth/verification", { method: "POST", body: input }),
  forgotPassword: (input: EmailOnlyInput) =>
    apiFetch<SentResult>("/auth/forgot-password", { method: "POST", body: input }),
  setPassword: (input: SetPasswordInput) =>
    apiFetch<RedirectResult>("/auth/set-password", { method: "POST", body: input }),
  updateAccount: (input: UpdateAccountInput) =>
    apiFetch<{ displayName: string }>("/account", { method: "PATCH", body: input }),
}
