import { SectionCard } from "@/components/shared/section-card"
import type { AudienceSkew, Lean } from "../taste.schemas"

const signed = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(2)}`
const describe = (value: number) => (value > 0 ? "more than average" : value < 0 ? "less than average" : "average")

// A diverging bar: the centre line is average, left is less, right is more. The value is always written out.
function LeanRow({ lean }: { lean: Lean }) {
  const width = `${Math.min(1, Math.abs(lean.value)) * 50}%`
  return (
    <li className="grid grid-cols-[6.5rem_minmax(0,1fr)_3.25rem] items-center gap-3 text-sm">
      <span className="truncate">{lean.label}</span>
      <span
        role="meter"
        aria-label={lean.label}
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={lean.value}
        aria-valuetext={`${signed(lean.value)}, ${describe(lean.value)}`}
        className="relative h-2 bg-muted"
      >
        <span aria-hidden className="absolute inset-y-[-3px] left-1/2 w-px bg-foreground/50" />
        <span
          aria-hidden
          className={
            lean.value >= 0
              ? "absolute inset-y-0 left-1/2 bg-success"
              : "absolute inset-y-0 right-1/2 bg-muted-foreground"
          }
          style={{ width }}
        />
      </span>
      <span className="text-right tabular-nums">{signed(lean.value)}</span>
    </li>
  )
}

export function AudienceLean({ audience }: { audience: AudienceSkew }) {
  const basedOn = audience.basedOn.map((tag) => tag.name).join(", ")
  return (
    <SectionCard title="Who loves these tastes" description={`The people behind ${basedOn}, against the average.`}>
      <div className="grid gap-6 sm:grid-cols-2">
        <ul aria-label="By age" className="space-y-2">
          {audience.age.map((lean) => (
            <LeanRow key={lean.key} lean={lean} />
          ))}
        </ul>
        <ul aria-label="By gender" className="space-y-2">
          {audience.gender.map((lean) => (
            <LeanRow key={lean.key} lean={lean} />
          ))}
        </ul>
      </div>
    </SectionCard>
  )
}
