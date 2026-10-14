import { REACH_LISTENERS, TYPICAL_SMALL_VENUE_FEE, type Reach } from "@/config/talent-reach"

// Whether an act is likely within the night's budget, from what is known about them: their monthly listeners and
// whether they are a household name in the venue's country. A bigger budget reaches proportionally bigger acts.
export function reachOf(
  act: { listeners: number | null; star: boolean | null },
  budgetCents: number,
  currency: string,
): Reach {
  if (act.star) return "beyond"
  const typical = TYPICAL_SMALL_VENUE_FEE[currency]
  const scale = typical ? Math.max(1, budgetCents / 100 / typical) : 1
  const listeners = act.listeners ?? 0
  if (listeners <= REACH_LISTENERS.within * scale) return "within"
  if (listeners <= REACH_LISTENERS.stretch * scale) return "stretch"
  return "beyond"
}
