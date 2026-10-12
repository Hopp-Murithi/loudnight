import { cn } from "@/lib/utils"
import { TONE, type Tone } from "./tone"

interface MeterBarProps {
  label: string
  value: number
  max: number
  valueText: string
  target?: number
  targetLabel?: string
  tone?: Tone
  className?: string
}

const percent = (value: number, max: number) => Math.min(100, Math.max(0, (value / max) * 100))

// A labelled bar that screen readers announce as a meter. The value is always written out, never colour alone.
export function MeterBar({
  label,
  value,
  max,
  valueText,
  target,
  targetLabel,
  tone = "info",
  className,
}: MeterBarProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 font-medium tabular-nums">{valueText}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        className="relative h-2 bg-muted"
      >
        <div
          className={cn("h-full transition-[width] duration-500 motion-reduce:transition-none", TONE[tone].dot)}
          style={{ width: `${percent(value, max)}%` }}
        />
        {target !== undefined && (
          <span
            aria-hidden
            className="absolute -top-1 h-4 w-0.5 bg-foreground"
            style={{ left: `${percent(target, max)}%` }}
          />
        )}
      </div>
      {target !== undefined && targetLabel && <p className="text-xs text-muted-foreground">{targetLabel}</p>}
    </div>
  )
}
