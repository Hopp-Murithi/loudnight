"use client"

import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStartPreview } from "../hooks/use-preview"

export function PreviewButton({ userId, name }: { userId: string; name: string }) {
  const start = useStartPreview()
  return (
    <Button variant="outline" disabled={start.isPending} onClick={() => start.mutate(userId)}>
      <Eye aria-hidden className="size-4" />
      {start.isPending ? "Opening" : `See Loudnight as ${name}`}
    </Button>
  )
}
