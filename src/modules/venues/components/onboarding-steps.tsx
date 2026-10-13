"use client"

import { useWatch, type UseFormReturn } from "react-hook-form"
import { TextField } from "@/components/forms/text-field"
import { FieldGroup } from "@/components/ui/field"
import { VENUE_CAPABILITY_LABELS, VENUE_TYPE_LABELS, WEEKDAY_LABELS } from "@/config/venues"
import { formatMoney } from "@/lib/format"
import { TYPE } from "@/lib/typography"
import { toCents, type PlaceOption, type VenueOnboardingInput } from "../venues.schemas"
import { PlaceSearch } from "./place-search"
import { TimeZoneField } from "./time-zone-field"
import { CapabilityPicker, NightPicker } from "./venue-fields"

interface StepProps {
  step: number
  form: UseFormReturn<VenueOnboardingInput>
}

function Heading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className={TYPE.h2}>{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function OnboardingStep({ step, form }: StepProps) {
  const { control, setValue, formState } = form
  const values = useWatch({ control })

  const choosePlace = (place: PlaceOption) => {
    const options = { shouldValidate: true, shouldDirty: true }
    setValue("googlePlaceId", place.googlePlaceId, options)
    setValue("name", place.name, options)
    setValue("address", place.address, options)
    setValue("latitude", place.latitude, options)
    setValue("longitude", place.longitude, options)
    setValue("venueType", place.venueType, options)
    setValue("timeZone", place.timeZone, options)
  }

  if (step === 0) {
    const selected = values.googlePlaceId ? ({ ...values, googlePlaceId: values.googlePlaceId } as PlaceOption) : null
    return (
      <section className="space-y-6">
        <Heading title="Find your venue" description="We use its location to read what your neighbourhood loves." />
        <PlaceSearch selected={selected} onSelect={choosePlace} error={formState.errors.googlePlaceId?.message} />
      </section>
    )
  }

  if (step === 1) {
    return (
      <section className="space-y-6">
        <Heading title="Your quiet night" description="The night Encore will plan a series for." />
        <FieldGroup>
          <NightPicker control={control} name="slowNight" />
          <TextField
            control={control}
            name="breakEvenHeadcount"
            label="Guests you need to break even"
            type="number"
            description="How many people pay for the night's staff and stock."
          />
        </FieldGroup>
      </section>
    )
  }

  if (step === 2) {
    return (
      <section className="space-y-6">
        <Heading title="Your space" description="So every idea fits the room you have." />
        <FieldGroup>
          <TextField control={control} name="capacity" label="How many people the room holds" type="number" />
          <CapabilityPicker control={control} name="capabilities" />
        </FieldGroup>
      </section>
    )
  }

  if (step === 3) {
    return (
      <section className="space-y-6">
        <Heading
          title="Money"
          description="Used to suggest talent you can afford and to show what a full night earns."
        />
        <FieldGroup>
          <TextField
            control={control}
            name="talentBudgetDollars"
            label="Talent budget per night, in dollars"
            type="number"
          />
          <TextField
            control={control}
            name="averageSpendDollars"
            label="What a guest spends, in dollars"
            type="number"
          />
        </FieldGroup>
      </section>
    )
  }

  const capabilities = values.capabilities ?? []
  return (
    <section className="space-y-6">
      <Heading title="Check and save" description="You can change any of this later in Settings." />
      <FieldGroup>
        <TextField control={control} name="name" label="Venue name" />
        <TimeZoneField control={control} name="timeZone" />
      </FieldGroup>
      <dl className="grid gap-x-6 gap-y-3 border p-4 text-sm sm:grid-cols-[12rem_1fr]">
        <dt className="text-muted-foreground">Address</dt>
        <dd>{values.address}</dd>
        <dt className="text-muted-foreground">Type</dt>
        <dd>{values.venueType && VENUE_TYPE_LABELS[values.venueType]}</dd>
        <dt className="text-muted-foreground">Quiet night</dt>
        <dd>{values.slowNight && WEEKDAY_LABELS[values.slowNight]}</dd>
        <dt className="text-muted-foreground">Break-even</dt>
        <dd>{values.breakEvenHeadcount} guests</dd>
        <dt className="text-muted-foreground">Room</dt>
        <dd>
          {values.capacity} people
          {capabilities.length > 0 &&
            `, with ${capabilities.map((item) => VENUE_CAPABILITY_LABELS[item].toLowerCase()).join(", ")}`}
        </dd>
        <dt className="text-muted-foreground">Money</dt>
        <dd>
          {formatMoney(toCents(values.talentBudgetDollars ?? 0))} for talent,{" "}
          {formatMoney(toCents(values.averageSpendDollars ?? 0))} per guest
        </dd>
      </dl>
    </section>
  )
}
