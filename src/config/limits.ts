export interface RateLimitRule {
  name: string
  max: number
  windowSeconds: number
}

const HOUR = 3600
const TEN_MINUTES = 600

// Per IP address. Supabase applies its own auth limits too; these stop abuse before it reaches them.
export const RATE_LIMITS = {
  signUp: { name: "auth-signup", max: 5, windowSeconds: HOUR },
  signIn: { name: "auth-login", max: 20, windowSeconds: TEN_MINUTES },
  passwordReset: { name: "auth-reset", max: 5, windowSeconds: HOUR },
  verification: { name: "auth-verify", max: 5, windowSeconds: HOUR },
  invite: { name: "team-invite", max: 30, windowSeconds: HOUR },
  placesSearch: { name: "places-search", max: 60, windowSeconds: TEN_MINUTES },
} as const satisfies Record<string, RateLimitRule>
