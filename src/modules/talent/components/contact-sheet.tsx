"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ExternalLink } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { showApiError } from "@/components/forms/api-errors"
import { SubmitButton } from "@/components/forms/submit-button"
import { TextAreaField } from "@/components/forms/text-area-field"
import { CopyButton } from "@/components/shared/copy-button"
import { DetailSheet } from "@/components/shared/detail-sheet"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { outreachEditSchema, type OutreachEditInput, type TalentView } from "@/modules/series/series.schemas"
import { useUpdateTalent } from "../hooks/use-talent"
import { mailtoLink } from "../talent.display"

interface ContactSheetProps {
  act: TalentView | null
  nightName: string
  canEdit: boolean
  onClose: () => void
}

function About({ act }: { act: TalentView }) {
  const { profile } = act
  return (
    <div className="space-y-4">
      {profile.knownFor && <p className="text-sm">{profile.knownFor}</p>}
      {profile.origin && <p className="text-sm text-muted-foreground">Born in {profile.origin}</p>}
      {profile.songs.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Listen first: <span className="text-foreground">{profile.songs.join(", ")}</span>
        </p>
      )}
      {profile.channels.length > 0 && (
        <ul aria-label={`Where to find ${act.name}`} className="flex flex-wrap gap-2">
          {profile.channels.map((channel) => (
            <li key={channel.id}>
              <Button
                variant="outline"
                nativeButton={false}
                render={<a href={channel.url} target="_blank" rel="noreferrer" />}
              >
                {channel.label}
                <ExternalLink aria-hidden className="size-3.5" />
                <span className="sr-only">, opens in a new tab</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MessageForm({ act, nightName, onDone }: { act: TalentView; nightName: string; onDone: () => void }) {
  const update = useUpdateTalent(act.id)
  const form = useForm<OutreachEditInput>({
    resolver: zodResolver(outreachEditSchema),
    defaultValues: { message: act.message ?? "" },
  })
  const message = useWatch({ control: form.control, name: "message" })
  const onError = (error: unknown) => showApiError(error, form.setError)

  return (
    <form noValidate onSubmit={form.handleSubmit((input) => update.mutate(input, { onError }))}>
      <FieldGroup>
        <TextAreaField
          control={form.control}
          name="message"
          label="Your message"
          description="Encore never sends this. Email it, or copy it into a direct message on one of their channels."
          rows={8}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="lg" nativeButton={false} render={<a href={mailtoLink(`Playing ${nightName}`, message)} />}>
            Email it
          </Button>
          <CopyButton text={message} label="Copy" size="lg" />
          <SubmitButton pending={update.isPending} pendingLabel="Saving" size="lg" variant="ghost">
            Save my wording
          </SubmitButton>
        </div>
        <Button
          type="button"
          variant={act.booked ? "outline" : "secondary"}
          disabled={update.isPending}
          onClick={() => update.mutate({ booked: !act.booked }, { onSuccess: onDone, onError })}
          className="self-start"
        >
          {act.booked ? "Not booked after all" : "They said yes: mark as booked"}
        </Button>
      </FieldGroup>
    </form>
  )
}

// Everything needed to reach one performer: who they are, where they are online, and a first message to send.
export function ContactSheet({ act, nightName, canEdit, onClose }: ContactSheetProps) {
  return (
    <DetailSheet
      open={act !== null}
      onOpenChange={(open) => !open && onClose()}
      title={act?.name ?? "Performer"}
      description={act?.profile.tagline ?? undefined}
    >
      {act && (
        <div className="space-y-6">
          <About act={act} />
          {canEdit && act.message && <MessageForm key={act.id} act={act} nightName={nightName} onDone={onClose} />}
          {!canEdit && act.message && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">The first message Encore drafted</h3>
              <p className="border bg-muted/40 p-4 text-sm whitespace-pre-line">{act.message}</p>
            </div>
          )}
        </div>
      )}
    </DetailSheet>
  )
}
