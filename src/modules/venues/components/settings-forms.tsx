"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { showApiError } from "@/components/forms/api-errors"
import { SubmitButton } from "@/components/forms/submit-button"
import { TextField } from "@/components/forms/text-field"
import { FieldGroup } from "@/components/ui/field"
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
import { PlaceSearch } from "./place-search"
import { TimeZoneField } from "./time-zone-field"
import { CapabilityPicker, NightPicker } from "./venue-fields"

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
        />
        <TimeZoneField control={form.control} name="timeZone" />
        <SubmitButton pending={update.isPending} pendingLabel="Saving" className="self-start">
          Save details
        </SubmitButton>
      </FieldGroup>
    </form>
  )
}

export function VenueSettingsForm({ venueId, settings }: { venueId: string; settings: VenueSettingsView }) {
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
        <CapabilityPicker control={form.control} name="capabilities" />
        <TextField
          control={form.control}
          name="talentBudgetDollars"
          label="Talent budget per night, in dollars"
          type="number"
        />
        <TextField
          control={form.control}
          name="averageSpendDollars"
          label="What a guest spends, in dollars"
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
