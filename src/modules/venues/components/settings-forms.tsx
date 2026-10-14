"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { showApiError } from "@/components/forms/api-errors"
import { SubmitButton } from "@/components/forms/submit-button"
import { TextField } from "@/components/forms/text-field"
import { FieldGroup } from "@/components/ui/field"
import { DEFAULT_COUNTRY } from "@/config/countries"
import { DEFAULT_CURRENCY, isCurrency } from "@/config/currencies"
import { DEFAULT_TIME_ZONE, isTimeZone } from "@/config/time-zones"
import { useDeleteVenue, useUpdateVenueIdentity, useUpdateVenueSettings } from "../hooks/use-venue-mutations"
import {
  deleteVenueSchema,
  venueIdentitySchema,
  venueSettingsSchema,
  type DeleteVenueInput,
  type PlaceOption,
  type VenueDetail,
  type VenueIdentityInput,
  type VenueSettingsInput,
  type VenueSettingsView,
} from "../venues.schemas"
import { CurrencyField } from "./currency-field"
import { PlaceSearch } from "./place-search"
import { TimeZoneField } from "./time-zone-field"
import { AtmospherePicker, CapabilityPicker, HostsPicker, NightPicker } from "./venue-fields"

export function VenueIdentityForm({ venue }: { venue: VenueDetail }) {
  const update = useUpdateVenueIdentity(venue.id)
  const form = useForm<VenueIdentityInput>({
    resolver: zodResolver(venueIdentitySchema),
    defaultValues: {
      name: venue.name,
      address: venue.address,
      googlePlaceId: venue.googlePlaceId ?? "",
      latitude: venue.latitude,
      longitude: venue.longitude,
      venueType: venue.venueType,
      timeZone: isTimeZone(venue.timeZone) ? venue.timeZone : DEFAULT_TIME_ZONE,
      countryCode: venue.countryCode,
      city: venue.city,
      currency: isCurrency(venue.currency) ? venue.currency : DEFAULT_CURRENCY,
    },
  })
  const values = useWatch({ control: form.control })
  const choose = (place: PlaceOption) =>
    form.reset({ ...place, name: values.name || place.name }, { keepDefaultValues: true })

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((input) => update.mutate(input, { onError: (e) => showApiError(e, form.setError) }))}
    >
      <FieldGroup>
        <TextField control={form.control} name="name" label="Venue name" />
        <PlaceSearch
          selected={values.googlePlaceId ? ({ ...values } as PlaceOption) : null}
          onSelect={choose}
          error={form.formState.errors.googlePlaceId?.message}
          initialCountry={venue.countryCode ?? DEFAULT_COUNTRY}
        />
        <TimeZoneField control={form.control} name="timeZone" />
        <CurrencyField control={form.control} name="currency" />
        <SubmitButton pending={update.isPending} pendingLabel="Saving" className="self-start">
          Save details
        </SubmitButton>
      </FieldGroup>
    </form>
  )
}

interface VenueSettingsFormProps {
  venueId: string
  settings: VenueSettingsView
  currency: string
}

export function VenueSettingsForm({ venueId, settings, currency }: VenueSettingsFormProps) {
  const update = useUpdateVenueSettings(venueId)
  const form = useForm<VenueSettingsInput>({ resolver: zodResolver(venueSettingsSchema), defaultValues: settings })

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((input) => update.mutate(input, { onError: (e) => showApiError(e, form.setError) }))}
    >
      <FieldGroup>
        <NightPicker control={form.control} name="slowNight" />
        <TextField
          control={form.control}
          name="breakEvenHeadcount"
          label="Guests you need to break even"
          type="number"
        />
        <TextField control={form.control} name="capacity" label="How many people the room holds" type="number" />
        <HostsPicker control={form.control} name="hosts" />
        <AtmospherePicker control={form.control} name="atmosphere" />
        <CapabilityPicker control={form.control} name="capabilities" />
        <TextField
          control={form.control}
          name="talentBudget"
          label={`Talent budget per night, in ${currency}`}
          type="number"
        />
        <TextField
          control={form.control}
          name="averageSpend"
          label={`What a guest spends, in ${currency}`}
          type="number"
        />
        <SubmitButton pending={update.isPending} pendingLabel="Saving" className="self-start">
          Save settings
        </SubmitButton>
      </FieldGroup>
    </form>
  )
}

export function DeleteVenueForm({ venue }: { venue: VenueDetail }) {
  const remove = useDeleteVenue(venue.id)
  const form = useForm<DeleteVenueInput>({
    resolver: zodResolver(deleteVenueSchema),
    defaultValues: { confirmName: "" },
  })
  const matches = (useWatch({ control: form.control, name: "confirmName" }) ?? "").trim() === venue.name

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((input) => remove.mutate(input, { onError: (e) => showApiError(e, form.setError) }))}
    >
      <FieldGroup>
        <TextField
          control={form.control}
          name="confirmName"
          label={`Type ${venue.name} to confirm`}
          description="This deletes the venue, its plans, nights, guest lists and history for the whole team."
        />
        <SubmitButton
          variant="destructive"
          pending={remove.isPending || remove.isSuccess}
          pendingLabel="Deleting"
          disabled={!matches}
          className="self-start"
        >
          Delete venue
        </SubmitButton>
      </FieldGroup>
    </form>
  )
}
