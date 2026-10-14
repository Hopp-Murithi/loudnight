import Link from "next/link"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/site"

export default function PublicNotFound() {
  return (
    <div className="space-y-4">
      <EmptyState title="Nothing here" description="The link may be old, or the night may have been removed." />
      <Button nativeButton={false} render={<Link href={ROUTES.home} />}>
        Back to Loudnight
      </Button>
    </div>
  )
}
