import { Ban, CircleCheck, Clock, MailQuestion, ShieldCheck, UserRound, UserX } from "lucide-react"
import { ToneBadge } from "@/components/shared/tone-badge"
import { ROLES } from "@/config/roles"
import { initials } from "@/lib/text"
import { cn } from "@/lib/utils"
import type { SignInState } from "../admin.schemas"

export function Initials({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-semibold text-primary",
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

export const VenueStatus = ({ suspended }: { suspended: boolean }) =>
  suspended ? (
    <ToneBadge tone="danger" icon={Ban} label="Suspended" />
  ) : (
    <ToneBadge tone="success" icon={CircleCheck} label="Active" />
  )

export function PersonStatus({ active, role }: { active: boolean; role: string }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {role === ROLES.administrator && <ToneBadge tone="info" icon={ShieldCheck} label="Administrator" />}
      {active ? (
        <ToneBadge tone="success" icon={CircleCheck} label="Active" />
      ) : (
        <ToneBadge tone="danger" icon={UserX} label="Deactivated" />
      )}
    </span>
  )
}

const SIGN_IN: Record<SignInState, { label: string; icon: typeof Clock; tone: "success" | "warning" | "neutral" }> = {
  joined: { label: "Joined", icon: CircleCheck, tone: "success" },
  invited: { label: "Invited, not joined yet", icon: MailQuestion, tone: "warning" },
  not_signed_in: { label: "Never signed in", icon: Clock, tone: "neutral" },
  guest: { label: "Guest, no email yet", icon: UserRound, tone: "neutral" },
}

export function SignInBadge({ state }: { state: SignInState }) {
  const entry = SIGN_IN[state]
  return <ToneBadge tone={entry.tone} icon={entry.icon} label={entry.label} />
}
