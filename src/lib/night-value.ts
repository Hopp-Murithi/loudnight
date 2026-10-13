import { PLAN_PRICE } from "@/config/landing"

export interface NightValueInput {
  guests: number
  spend: number
  nightsPerMonth: number
}

export interface NightValue {
  monthly: number
  timesPlan: number
}

// What a filled quiet night is worth in a month, and how many times over it pays for the top plan.
export function nightValue({ guests, spend, nightsPerMonth }: NightValueInput): NightValue {
  const monthly = Math.max(0, guests) * Math.max(0, spend) * Math.max(0, nightsPerMonth)
  return { monthly, timesPlan: Math.floor(monthly / PLAN_PRICE.to) }
}
