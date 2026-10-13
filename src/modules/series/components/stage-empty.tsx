import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface StageEmptyProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; href: string }
  children?: ReactNode
}

// An empty page that still feels like a venue before doors: what will be here, and the one step that gets you there.
export function StageEmpty({ icon: Icon, title, description, action, children }: StageEmptyProps) {
  return (
    <section className="relative overflow-hidden border bg-card p-6 sm:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-spotlight/15 blur-3xl"
      />
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <div className="space-y-4">
          <span className="grid size-11 place-items-center bg-primary/12 text-primary">
            <Icon aria-hidden className="size-5" />
          </span>
          <h2 className="font-display text-4xl leading-none font-bold text-balance">{title}</h2>
          <p className="max-w-md text-muted-foreground">{description}</p>
          {action && (
            <Button size="lg" nativeButton={false} render={<Link href={action.href} />}>
              {action.label}
            </Button>
          )}
        </div>
        {children && <div className="min-w-0">{children}</div>}
      </div>
    </section>
  )
}
