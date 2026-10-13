"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { UserMinus } from "lucide-react"
import { useId } from "react"
import { Controller, useForm } from "react-hook-form"
import { showApiError } from "@/components/forms/api-errors"
import { SubmitButton } from "@/components/forms/submit-button"
import { TextField } from "@/components/forms/text-field"
import { IconButton } from "@/components/shared/icon-button"
import { ToneBadge } from "@/components/shared/tone-badge"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useChangeRole, useInvite, useRemoveMember } from "../hooks/use-team-mutations"
import { INVITABLE_ROLES, VENUE_ROLE_LABELS, inviteSchema, type InviteInput, type TeamMember } from "../team.schemas"

const selectClass =
  "h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"

function MemberRow({ member, venueId, canEdit }: { member: TeamMember; venueId: string; canEdit: boolean }) {
  const changeRole = useChangeRole(venueId)
  const remove = useRemoveMember(venueId)
  const editable = canEdit && member.role !== "owner"

  return (
    <li className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {member.name}
          {member.isYou && <span className="text-muted-foreground"> (you)</span>}
        </p>
        {member.email && <p className="truncate text-sm text-muted-foreground">{member.email}</p>}
      </div>
      {editable ? (
        <select
          aria-label={`Role for ${member.name}`}
          className={selectClass}
          value={member.role}
          disabled={changeRole.isPending}
          onChange={(event) =>
            changeRole.mutate(
              { userId: member.userId, role: event.target.value as InviteInput["role"] },
              { onError: (error) => showApiError(error) },
            )
          }
        >
          {INVITABLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {VENUE_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      ) : (
        <ToneBadge tone={member.role === "owner" ? "info" : "neutral"} label={VENUE_ROLE_LABELS[member.role]} />
      )}
      {editable && (
        <IconButton
          label={`Remove ${member.name} from the team`}
          disabled={remove.isPending}
          onClick={() => remove.mutate(member.userId, { onError: (error) => showApiError(error) })}
        >
          <UserMinus className="size-4" />
        </IconButton>
      )}
    </li>
  )
}

function InviteForm({ venueId }: { venueId: string }) {
  const invite = useInvite(venueId)
  const roleId = useId()
  const form = useForm<InviteInput>({ resolver: zodResolver(inviteSchema), defaultValues: { email: "", role: "door" } })

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((input) =>
        invite.mutate(input, {
          onSuccess: () => form.reset({ email: "", role: input.role }),
          onError: (error) => showApiError(error, form.setError),
        }),
      )}
    >
      <FieldGroup>
        <TextField control={form.control} name="email" label="Their email" type="email" autoComplete="off" />
        <Controller
          control={form.control}
          name="role"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={roleId}>Role</FieldLabel>
              <select id={roleId} {...field} className={selectClass}>
                <option value="manager">Manager: plans nights and sees money</option>
                <option value="door">Door staff: checks guests in, never sees money</option>
              </select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <SubmitButton pending={invite.isPending} pendingLabel="Sending the invitation" className="self-start">
          Send invitation
        </SubmitButton>
      </FieldGroup>
    </form>
  )
}

export function TeamPanel({ venueId, members, canEdit }: { venueId: string; members: TeamMember[]; canEdit: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <ul className="divide-y border" aria-label="Team">
        {members.map((member) => (
          <MemberRow key={member.userId} member={member} venueId={venueId} canEdit={canEdit} />
        ))}
      </ul>
      {canEdit && (
        <section aria-labelledby="invite-heading" className="space-y-4 border p-4">
          <h2 id="invite-heading" className="font-semibold">
            Invite someone
          </h2>
          <InviteForm venueId={venueId} />
        </section>
      )}
    </div>
  )
}
