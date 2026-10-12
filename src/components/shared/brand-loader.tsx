import Image from "next/image"
import { cn } from "@/lib/utils"

interface BrandLoaderProps {
  label?: string
  className?: string
}

// The Encore mark inside a turning spotlight ring. Announced to screen readers, still under reduced motion.
export function BrandLoader({ label = "Loading", className }: BrandLoaderProps) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative size-20">
        <span className="absolute inset-0 rounded-full border-2 border-primary/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-spotlight border-r-spotlight/40 motion-reduce:animate-none" />
        <span className="absolute inset-3 grid place-items-center">
          <Image
            src="/logo.svg"
            alt=""
            width={40}
            height={40}
            priority
            className="size-10 animate-pulse motion-reduce:animate-none"
          />
        </span>
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
