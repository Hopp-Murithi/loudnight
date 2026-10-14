import { headers } from "next/headers"
import { NightStage } from "@/components/landing/night-stage"
import { PhotoCredits } from "@/components/layout/nights-gallery"
import { regionFor } from "@/config/landing-regions"
import { ROUTES } from "@/config/site"
import { createServerSupabase } from "@/lib/supabase/server"
import { hasAccountSession } from "@/modules/auth/server/context"
import { venuesService } from "@/modules/venues/venues.service"

// One pinned stage, always night: the world, the visitor's own country, a room, the lights, then the world again.
// The country comes from Vercel's IP country header and is used for this page only, never stored.
export default async function HomePage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const [demoVenues, signedIn, requestHeaders, { region: asked }] = await Promise.all([
    createServerSupabase().then(venuesService.listDemoVenues),
    hasAccountSession(),
    headers(),
    searchParams,
  ])
  const example = demoVenues.find((venue) => venue.planReady)

  return (
    <div className="dark bg-background text-foreground">
      <NightStage
        region={regionFor(requestHeaders.get("x-vercel-ip-country"), asked)}
        signedIn={signedIn}
        exampleHref={example ? ROUTES.demo(example.id) : null}
      />
      <footer className="stage-credits mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <PhotoCredits />
      </footer>
    </div>
  )
}
