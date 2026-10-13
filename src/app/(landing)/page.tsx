import type { ReactNode } from "react"
import { ClosingBand } from "@/components/landing/closing-band"
import { EncoreLoop } from "@/components/landing/encore-loop"
import { LandingHero } from "@/components/landing/landing-hero"
import { NightValueCalculator } from "@/components/landing/night-value-calculator"
import { ReceiptExplorer } from "@/components/landing/receipt-explorer"
import { TwoAnswers } from "@/components/landing/two-answers"
import { createServerSupabase } from "@/lib/supabase/server"
import { TYPE } from "@/lib/typography"
import { DemoVenueList } from "@/modules/venues/components/demo-venue-list"
import { venuesService } from "@/modules/venues/venues.service"

const Band = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">{children}</div>
)

// The story in one scroll: the quiet room, two answers, the loop, the receipts, the money, real venues, the full room.
export default async function HomePage() {
  const demoVenues = await venuesService.listDemoVenues(await createServerSupabase())

  return (
    <>
      <LandingHero />
      <Band>
        <TwoAnswers />
      </Band>
      <div className="bg-muted/40">
        <Band>
          <EncoreLoop />
        </Band>
      </div>
      <Band>
        <ReceiptExplorer />
      </Band>
      <div className="border-y bg-muted/40">
        <Band>
          <NightValueCalculator />
        </Band>
      </div>
      <Band>
        <section aria-labelledby="demo-heading" className="scroll-mt-8 space-y-6">
          <div className="space-y-3">
            <h2 id="demo-heading" className={TYPE.h1}>
              Try it on a real neighbourhood.
            </h2>
            <p className={TYPE.lead}>
              Three real venues in Brooklyn, Austin and Chicago. Open any of them without an account.
            </p>
          </div>
          <DemoVenueList venues={demoVenues} />
        </section>
      </Band>
      <ClosingBand />
    </>
  )
}
