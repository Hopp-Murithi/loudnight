"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { showApiError } from "@/components/forms/api-errors"
import { SubmitButton } from "@/components/forms/submit-button"
import { TextAreaField } from "@/components/forms/text-area-field"
import { CopyButton } from "@/components/shared/copy-button"
import { DetailSheet } from "@/components/shared/detail-sheet"
import { FieldGroup } from "@/components/ui/field"
import { outreachEditSchema, type OutreachEditInput, type TalentView } from "@/modules/series/series.schemas"
import { useEditOutreach } from "../hooks/use-talent"

function OutreachForm({ act, onDone }: { act: TalentView; onDone: () => void }) {
  const save = useEditOutreach(act.id)
  const form = useForm<OutreachEditInput>({
    resolver: zodResolver(outreachEditSchema),
    defaultValues: { message: act.message ?? "" },
  })
  const message = useWatch({ control: form.control, name: "message" })

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((input) =>
        save.mutate(input.message, { onSuccess: onDone, onError: (error) => showApiError(error, form.setError) }),
      )}
    >
      <FieldGroup>
        <TextAreaField
          control={form.control}
          name="message"
          label="Your message"
          description="Encore never sends this. Copy it and send it yourself, your way."
          rows={9}
        />
        <div className="flex flex-wrap gap-3">
          <CopyButton text={message} label="Copy the message" size="lg" variant="default" />
          <SubmitButton pending={save.isPending} pendingLabel="Saving" size="lg" variant="outline">
            Save my wording
          </SubmitButton>
        </div>
      </FieldGroup>
    </form>
  )
}

// A first message to one performer, ready to reword and copy. The date, time and fee in it are the venue's own.
export function OutreachSheet({ act, onClose }: { act: TalentView | null; onClose: () => void }) {
  return (
    <DetailSheet
      open={act !== null}
      onOpenChange={(open) => !open && onClose()}
      title={act ? `Message for ${act.name}` : "Message"}
      description={act?.edited ? "You reworded this one." : "Drafted for you. Change anything."}
    >
      {act && <OutreachForm key={act.id} act={act} onDone={onClose} />}
    </DetailSheet>
  )
}
