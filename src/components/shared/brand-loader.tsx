import Image from "next/image"
import { cn } from "@/lib/utils"

interface BrandLoaderProps {
  label?: string
  className?: string
}

// Heights and beats for the five equaliser bars; under reduced motion they hold these heights still.
const BARS = [
  { height: "45%", delay: "0ms" },
  { height: "85%", delay: "-160ms" },
  { height: "100%", delay: "-320ms" },
  { height: "70%", delay: "-80ms" },
  { height: "50%", delay: "-240ms" },
]

// The Loudnight mark over an equaliser that plays while the page loads. Announced to screen readers.
export function BrandLoader({ label = "Loading", className }: BrandLoaderProps) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative grid place-items-center">
        <span aria-hidden className="absolute size-24 rounded-full bg-spotlight/15 blur-xl" />
        <Image src="/logo.svg" alt="" width={56} height={56} priority className="relative size-14" />
      </div>
      <div aria-hidden className="flex h-7 items-end gap-1">
        {BARS.map((bar) => (
          <span
            key={bar.delay}
            className="eq-bar w-1.5 bg-primary motion-reduce:animate-none"
            style={{ height: bar.height, animationDelay: bar.delay }}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="grid min-h-[60dvh] place-items-center">
      <BrandLoader label={label} />
    </div>
  )
}
