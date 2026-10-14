import { NightStage } from "@/components/landing/night-stage"
import { PhotoCredits } from "@/components/layout/nights-gallery"
import { ROUTES } from "@/config/site"
import { createServerSupabase } from "@/lib/supabase/server"
import { hasAccountSession } from "@/modules/auth/server/context"
import { venuesService } from "@/modules/venues/venues.service"

// One pinned stage, always night: the world, an area, a room, the lights, then the world again.
export default async function HomePage() {
  const [demoVenues, signedIn] = await Promise.all([
    venuesService.listDemoVenues(await createServerSupabase()),
    hasAccountSession(),
  ])
  const example = demoVenues.find((venue) => venue.planReady)

  return (
    <div className="dark bg-background text-foreground">
      <NightStage signedIn={signedIn} exampleHref={example ? ROUTES.demo(example.id) : null} />
      <footer className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <PhotoCredits />
      </footer>
    </div>
  )
}
