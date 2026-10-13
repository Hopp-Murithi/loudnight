"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm, type FieldPath } from "react-hook-form"
import { showApiError } from "@/components/forms/api-errors"
import { SubmitButton } from "@/components/forms/submit-button"
import { StickyActionBar } from "@/components/shared/sticky-action-bar"
import { Stepper, type StepItem } from "@/components/shared/stepper"
import { Button } from "@/components/ui/button"
import { DEFAULT_TIME_ZONE } from "@/config/time-zones"
import { useCreateVenue } from "../hooks/use-venue-mutations"
import { venueOnboardingSchema, type VenueOnboardingInput } from "../venues.schemas"
import { OnboardingStep } from "./onboarding-steps"

type Fields = FieldPath<VenueOnboardingInput>

export const ONBOARDING_STEPS: { label: string; fields: Fields[] }[] = [
  { label: "Find your venue", fields: ["googlePlaceId", "name", "address", "latitude", "longitude", "venueType"] },
  { label: "Your quiet night", fields: ["slowNight", "breakEvenHeadcount"] },
  { label: "Your space", fields: ["capacity", "capabilities"] },
  { label: "Money", fields: ["talentBudgetDollars", "averageSpendDollars"] },
  { label: "Check and save", fields: ["name", "timeZone"] },
]

export function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const create = useCreateVenue()
  const form = useForm<VenueOnboardingInput>({
    resolver: zodResolver(venueOnboardingSchema),
    defaultValues: { capabilities: [], timeZone: DEFAULT_TIME_ZONE, talentBudgetDollars: 0, averageSpendDollars: 20 },
  })
  const last = step === ONBOARDING_STEPS.length - 1

  const steps: StepItem[] = ONBOARDING_STEPS.map(({ label }, index) => ({
    id: label,
    label,
    status: index < step ? "done" : index === step ? "running" : "pending",
  }))

  async function next() {
    if (await form.trigger(ONBOARDING_STEPS[step].fields)) setStep((current) => current + 1)
  }

  const submit = form.handleSubmit((values) =>
    create.mutate(values, { onError: (error) => showApiError(error, form.setError) }),
  )

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <Stepper steps={steps} className="hidden lg:block" />
      <p className="text-sm text-muted-foreground lg:hidden" aria-live="polite">
        Step {step + 1} of {ONBOARDING_STEPS.length}: {ONBOARDING_STEPS[step].label}
      </p>
      <form noValidate onSubmit={submit} className="min-w-0 space-y-8">
        <OnboardingStep step={step} form={form} />
        <StickyActionBar>
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={() => setStep((current) => current - 1)}>
              Back
            </Button>
          )}
          {last ? (
            <SubmitButton pending={create.isPending || create.isSuccess} pendingLabel="Saving your venue">
              Save venue
            </SubmitButton>
          ) : (
            <Button type="button" onClick={next}>
              Continue
            </Button>
          )}
        </StickyActionBar>
      </form>
    </div>
  )
}
