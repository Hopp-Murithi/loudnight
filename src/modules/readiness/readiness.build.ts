import { LOGISTICS, type LogisticsId } from "@/config/readiness"
import { ROUTES } from "@/config/site"
import { VENUE_CAPABILITY_LABELS, type VenueCapability } from "@/config/venues"
import { formatMoney, plural } from "@/lib/format"
import { z } from "zod"

export const checklistSchema = z.object({
  done: z.array(z.enum(LOGISTICS.map((item) => item.id) as [LogisticsId, ...LogisticsId[]])).max(LOGISTICS.length),
})

export type ChecklistInput = z.infer<typeof checklistSchema>

export interface ReadinessInput {
  venueId: string
  conceptName: string
  needs: VenueCapability[]
  capabilities: VenueCapability[]
  costCents: number
  budgetCents: number
  currency: string
  hasSeries: boolean
  bookedCount: number
  shortlistCount: number
  adSaved: boolean
  logisticsDone: string[]
}

export interface ReadinessStep {
  id: string
  label: string
  done: boolean
  hint: string
  href: string
}

export interface Readiness {
  steps: ReadinessStep[]
  logistics: { id: LogisticsId; label: string; done: boolean }[]
  done: number
  total: number
}

const LIST = new Intl.ListFormat("en-US", { style: "long", type: "conjunction" })

// What is ready for the chosen night and what is not, each with the one place to go and fix it.
export function buildReadiness(input: ReadinessInput): Readiness {
  const { venueId } = input
  const missing = input.needs.filter((need) => !input.capabilities.includes(need))
  const within = input.costCents <= input.budgetCents
  const money = `About ${formatMoney(input.costCents, input.currency)} a night against a ${formatMoney(input.budgetCents, input.currency)} budget`
  const steps: ReadinessStep[] = [
    { id: "night", label: "Night chosen", done: true, hint: input.conceptName, href: ROUTES.venuePlan(venueId) },
    {
      id: "series",
      label: "Four weeks on the calendar",
      done: input.hasSeries,
      hint: input.hasSeries ? "Four dates, each with its own twist" : "One tap on the Series page",
      href: ROUTES.venueSeries(venueId),
    },
    {
      id: "act",
      label: "A performer booked",
      done: input.bookedCount > 0,
      hint:
        input.bookedCount > 0
          ? `${plural(input.bookedCount, "act")} said yes`
          : input.shortlistCount > 0
            ? `${plural(input.shortlistCount, "performer")} on your shortlist. Message one.`
            : "Find performers on the Series page",
      href: ROUTES.venueSeries(venueId),
    },
    {
      id: "ad",
      label: "An ad made",
      done: input.adSaved,
      hint: input.adSaved ? "Your poster design is saved" : "Posters and a short video, on the Promote page",
      href: ROUTES.venuePromote(venueId),
    },
    {
      id: "room",
      label: "The room can host it",
      done: missing.length === 0,
      hint:
        missing.length === 0
          ? "Everything this night needs is in your room"
          : `This night needs ${LIST.format(missing.map((need) => VENUE_CAPABILITY_LABELS[need].toLowerCase()))}`,
      href: ROUTES.venueSettings(venueId),
    },
    {
      id: "budget",
      label: "Inside your talent budget",
      done: within,
      hint: within ? money : `${money}. Raise the budget or book a smaller act.`,
      href: ROUTES.venueSettings(venueId),
    },
  ]
  const logistics = LOGISTICS.map((item) => ({ ...item, done: input.logisticsDone.includes(item.id) }))
  return {
    steps,
    logistics,
    done: steps.filter((step) => step.done).length + logistics.filter((item) => item.done).length,
    total: steps.length + logistics.length,
  }
}
