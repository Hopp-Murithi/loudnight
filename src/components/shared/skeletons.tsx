import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Placeholders shaped like the content they stand in for, so nothing jumps when it arrives.
export function CardSkeleton() {
  return (
    <Card aria-hidden>
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </CardContent>
    </Card>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden className="divide-y border">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 p-3">
          <Skeleton className="size-8 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TraceSkeleton({ steps = 6 }: { steps?: number }) {
  return (
    <div aria-hidden className="space-y-5">
      {Array.from({ length: steps }, (_, index) => (
        <div key={index} className="flex gap-3">
          <Skeleton className="size-4 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}
