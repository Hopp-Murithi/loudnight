import { SITE } from "@/config/site"
import { createServerSupabase } from "@/lib/supabase/server"
import { TYPE } from "@/lib/typography"
import { DemoVenueList } from "@/modules/venues/components/demo-venue-list"
import { JourneySteps } from "@/modules/venues/components/journey-steps"
import { venuesService } from "@/modules/venues/venues.service"

export default async function HomePage() {
  const demoVenues = await venuesService.listDemoVenues(await createServerSupabase())

  return (
    <div className="space-y-16 sm:space-y-24">
      <section className="space-y-6">
        <span aria-hidden className="block h-1.5 w-16 bg-spotlight" />
        <h1 className={TYPE.display}>{SITE.tagline}</h1>
        <p className={TYPE.lead}>{SITE.description}</p>
      </section>

      <section aria-labelledby="journey-heading" className="space-y-6">
        <h2 id="journey-heading" className={TYPE.h2}>
          From an empty night to a full room
        </h2>
        <JourneySteps />
      </section>

      <section aria-labelledby="demo-heading" className="space-y-6">
        <div className="space-y-1">
          <h2 id="demo-heading" className={TYPE.h2}>
            Demo venues
          </h2>
          <p className="text-sm text-muted-foreground">Real neighbourhoods, open without an account.</p>
        </div>
        <DemoVenueList venues={demoVenues} />
      </section>
    </div>
  )
}
