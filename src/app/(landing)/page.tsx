import { LandingHero } from "@/components/landing/landing-hero"
import { NightStory } from "@/components/landing/night-story"
import { PhotoCredits } from "@/components/layout/nights-gallery"
import { createServerSupabase } from "@/lib/supabase/server"
import { DemoVenueList } from "@/modules/venues/components/demo-venue-list"
import { venuesService } from "@/modules/venues/venues.service"

// Two slides, always night: the quiet room and the promise, then the whole use case in five pictures.
export default async function HomePage() {
  const demoVenues = await venuesService.listDemoVenues(await createServerSupabase())

  return (
    <div className="slides dark bg-background text-foreground">
      <LandingHero />
      <div className="slide stage-glow flex min-h-svh flex-col justify-center">
        <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-14 sm:px-6">
          <NightStory />
          <section
            id="demo"
            aria-labelledby="demo-heading"
            className="reveal flex flex-wrap items-center gap-x-4 gap-y-3"
          >
            <h2 id="demo-heading" className="text-sm text-muted-foreground">
              See a finished plan, no account needed:
            </h2>
            <DemoVenueList venues={demoVenues} />
          </section>
          <PhotoCredits />
        </div>
      </div>
    </div>
  )
}
