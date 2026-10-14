"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"
import { showApiError } from "@/components/forms/api-errors"
import { SubmitButton } from "@/components/forms/submit-button"
import { TextField } from "@/components/forms/text-field"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useRsvp } from "../hooks/use-rsvp"
import { rsvpSchema, type RsvpInput, type RsvpValues } from "../events.schemas"

// Two fields and a number. The ticket comes on the next screen.
export function RsvpForm({ slug, venueName }: { slug: string; venueName: string }) {
  const rsvp = useRsvp(slug)
  const form = useForm<RsvpInput, unknown, RsvpValues>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: { name: "", contact: "", partySize: 1, consent: false, website: "" },
  })
  const contact = useWatch({ control: form.control, name: "contact" })

  return (
    <form
      id="rsvp"
      noValidate
      onSubmit={form.handleSubmit((input) => rsvp.mutate(input, { onError: (e) => showApiError(e, form.setError) }))}
      className="scroll-mt-24"
    >
      <FieldGroup>
        <TextField control={form.control} name="name" label="Your name" autoComplete="name" />
        <TextField
          control={form.control}
          name="contact"
          label="Email or phone (optional)"
          autoComplete="email"
          description="Only if you want the venue to tell you about changes to this night."
        />
        {contact ? (
          <Controller
            control={form.control}
            name="consent"
            render={({ field, fieldState }) => (
              <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                <Checkbox
                  id="rsvp-consent"
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  aria-invalid={fieldState.invalid}
                />
                <FieldLabel htmlFor="rsvp-consent" className="font-normal">
                  {venueName} may contact me about this night.
                </FieldLabel>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        ) : null}
        <TextField control={form.control} name="partySize" label="How many of you" type="number" />
        <input
          {...form.register("website")}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />
        <SubmitButton size="lg" pending={rsvp.isPending} pendingLabel="Saving your place" className="w-full sm:w-auto">
          Save my place
        </SubmitButton>
        <p className="text-xs text-muted-foreground">
          Only {venueName} sees your details. Encore keeps them for this night and nothing else.
        </p>
      </FieldGroup>
    </form>
  )
}
