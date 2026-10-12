import Link from "next/link"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/site"

export default function AdminNotFound() {
  return (
    <div className="space-y-4">
      <EmptyState
        title="Nothing here"
        description="This page does not exist, or it belongs to a venue you are not part of."
      />
      <Button nativeButton={false} render={<Link href={ROUTES.venues} />}>
        Back to your venues
      </Button>
    </div>
  )
}
