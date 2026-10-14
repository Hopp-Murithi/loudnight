"use client"

import { CircleCheck, ShieldCheck, UserX } from "lucide-react"
import { ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { ROLES } from "@/config/roles"
import type { AdminPerson } from "../admin.schemas"
import { useSetPersonActive } from "../hooks/use-admin"

// One person: who they are, their standing, and deactivate or reactivate with a plain confirm.
export function PersonAdminRow({ person, isMe }: { person: AdminPerson; isMe: boolean }) {
  const setActive = useSetPersonActive(person.id)
  const admin = person.role === ROLES.administrator
  const change = () => {
    const question = person.isActive
      ? `Deactivate ${person.name}? They are signed out everywhere and lose access to every venue until reactivated.`
      : `Reactivate ${person.name}? They can sign in and use their venues again.`
    if (window.confirm(question)) setActive.mutate(!person.isActive)
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border bg-card p-4">
      <div className="min-w-0 space-y-1">
        <p className="font-medium break-words">{person.name}</p>
        <p className="text-sm break-all text-muted-foreground">
          {person.isAnonymous ? "Signed in without an email yet" : person.email}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {admin && <ToneBadge tone="info" icon={ShieldCheck} label="Administrator" />}
        {person.isActive ? (
          <ToneBadge tone="success" icon={CircleCheck} label="Active" />
        ) : (
          <ToneBadge tone="danger" icon={UserX} label="Deactivated" />
        )}
        {!admin && !isMe && (
          <Button
            variant={person.isActive ? "outline" : "default"}
            size="sm"
            disabled={setActive.isPending}
            onClick={change}
          >
            {setActive.isPending ? "Saving" : person.isActive ? "Deactivate" : "Reactivate"}
          </Button>
        )}
      </div>
    </li>
  )
}
