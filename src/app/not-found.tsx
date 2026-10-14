import Link from "next/link"
import { Brand } from "@/components/layout/brand"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/site"

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="flex max-w-sm flex-col items-center gap-5 text-center">
        <Brand />
        <h1 className="text-2xl font-semibold tracking-tight">This page does not exist</h1>
        <p className="text-sm text-muted-foreground">The link may be old, or the night may have been removed.</p>
        <Button nativeButton={false} render={<Link href={ROUTES.home} />}>
          Back to Loudnight
        </Button>
      </div>
    </main>
  )
}
