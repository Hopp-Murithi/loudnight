import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TONE, type Tone } from "./tone"

interface KpiCardProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: LucideIcon
  tone?: Tone
  meter?: number
}

export function KpiCard({ label, value, hint, icon: Icon, tone = "neutral", meter }: KpiCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span className={cn("grid size-8 shrink-0 place-items-center", TONE[tone].soft)}>
            <Icon className="size-4" aria-hidden />
          </span>
        </div>
        <p className="text-3xl leading-none font-semibold tracking-tight tabular-nums">{value}</p>
        {meter !== undefined && (
          <div
            role="meter"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={meter}
            className="h-1.5 bg-muted"
          >
            <div
              className={cn("h-full transition-[width] duration-700", TONE[tone].dot)}
              style={{ width: `${meter}%` }}
            />
          </div>
        )}
        {hint && <p className="mt-auto text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
