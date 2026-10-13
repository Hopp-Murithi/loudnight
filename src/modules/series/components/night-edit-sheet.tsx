"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { showApiError } from "@/components/forms/api-errors"
import { SubmitButton } from "@/components/forms/submit-button"
import { TextAreaField } from "@/components/forms/text-area-field"
import { TextField } from "@/components/forms/text-field"
import { DetailSheet } from "@/components/shared/detail-sheet"
import { FieldGroup } from "@/components/ui/field"
import { WEEK_NAMES } from "@/config/series"
import { useUpdateNight } from "../hooks/use-series"
import { nightEditSchema, type NightEditInput, type NightView } from "../series.schemas"

function NightForm({ night, onDone }: { night: NightView; onDone: () => void }) {
  const save = useUpdateNight(night.id)
  const form = useForm<NightEditInput>({
    resolver: zodResolver(nightEditSchema),
    defaultValues: { date: night.localDate, time: night.localTime, variation: night.variation },
  })

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((input) =>
        save.mutate(input, { onSuccess: onDone, onError: (error) => showApiError(error, form.setError) }),
      )}
    >
      <FieldGroup>
        <div className="grid grid-cols-2 gap-4">
          <TextField control={form.control} name="date" label="Date" type="date" />
          <TextField control={form.control} name="time" label="Starts at" type="time" />
        </div>
        <TextAreaField
          control={form.control}
          name="variation"
          label="What makes this week different"
          description="One line your regulars would repeat to a friend."
        />
        <SubmitButton pending={save.isPending} pendingLabel="Saving" size="lg" className="self-start">
          Save this night
        </SubmitButton>
      </FieldGroup>
    </form>
  )
}

// Date, start time and the week's twist, in the venue's own time zone. Published nights are not edited here.
export function NightEditSheet({ night, onClose }: { night: NightView | null; onClose: () => void }) {
  return (
    <DetailSheet
      open={night !== null}
      onOpenChange={(open) => !open && onClose()}
      title={night ? `Edit ${WEEK_NAMES[night.sequence - 1].toLowerCase()}` : "Edit the night"}
      description="Times are on your venue's own clock."
    >
      {night && <NightForm key={night.id} night={night} onDone={onClose} />}
    </DetailSheet>
  )
}
