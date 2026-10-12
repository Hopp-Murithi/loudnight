import type { ReactNode } from "react"
import { TYPE } from "@/lib/typography"

export function GallerySection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="space-y-6 border-t pt-10">
      <div className="space-y-1">
        <h2 className={TYPE.h2}>{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

export function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-2">
      <p className={TYPE.caption}>{label}</p>
      <div className="flex min-w-0 flex-wrap items-start gap-3">{children}</div>
    </div>
  )
}
