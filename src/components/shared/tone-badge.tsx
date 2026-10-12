import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { TONE, type Tone } from "./tone"

interface ToneBadgeProps {
  tone: Tone
  label: string
  icon?: LucideIcon
  className?: string
}

// Colour is never the only signal: every badge carries a text label and an icon.
export function ToneBadge({ tone, label, icon: Icon, className }: ToneBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE[tone].soft,
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {label}
    </span>
  )
}
