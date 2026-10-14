"use client"

import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEndPreview } from "../hooks/use-preview"

// Above every signed-in page while previewing: whose view this is, that it is read only, and the way out.
export function PreviewBanner({ name, adminName }: { name: string; adminName: string }) {
  const end = useEndPreview()
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 bg-info px-4 py-2 text-sm text-white sm:px-6">
      <Eye aria-hidden className="size-4 shrink-0" />
      <p className="min-w-0 flex-1">
        <span className="font-medium">Previewing as {name}.</span> Read only, for {adminName}. It ends within an hour.
      </p>
      <Button size="sm" variant="secondary" disabled={end.isPending} onClick={() => end.mutate()}>
        {end.isPending ? "Ending" : "Exit preview"}
      </Button>
    </div>
  )
}
