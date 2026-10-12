import type { ReactNode } from "react"
import { TYPE } from "@/lib/typography"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1 basis-64 space-y-2">
        <h1 className={TYPE.h1}>{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex max-w-full min-w-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
