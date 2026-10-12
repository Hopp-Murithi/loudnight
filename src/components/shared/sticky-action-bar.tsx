import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export const STICKY_BAR_CLASSES =
  "fixed inset-x-0 bottom-0 z-30 flex items-center justify-end gap-2 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"

// On phones the main action sits under the thumb; from tablet width it returns to the page flow.
export function StickyActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <>
      <div aria-hidden data-slot="sticky-spacer" className="h-20 md:hidden" />
      <div data-slot="sticky-action-bar" className={cn(STICKY_BAR_CLASSES, className)}>
        {children}
      </div>
    </>
  )
}
