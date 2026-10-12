import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FadeInProps {
  children: ReactNode
  delay?: number
  className?: string
}

// Gentle entrance. `delay` is a step index, so lists stagger without any timers.
export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  const style: CSSProperties = { animationDelay: `${delay * 60}ms`, animationFillMode: "backwards" }
  return (
    <div
      style={style}
      className={cn(
        "min-w-0 animate-in duration-500 fade-in slide-in-from-bottom-2 motion-reduce:animate-none",
        className,
      )}
    >
      {children}
    </div>
  )
}
