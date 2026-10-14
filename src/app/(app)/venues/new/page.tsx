import type { Metadata } from "next"
import { headers } from "next/headers"
import { PageHeader } from "@/components/layout/page-header"
import { countryOr } from "@/config/countries"
import { getPageContext } from "@/modules/auth/server/context"
import { OnboardingWizard } from "@/modules/venues/components/onboarding-wizard"

export const metadata: Metadata = { title: "Add a venue" }

// The search starts in the visitor's own country (from the request; never stored), and the owner can change it.
export default async function NewVenuePage() {
  const [, requestHeaders] = await Promise.all([getPageContext(), headers()])
  return (
    <>
      <PageHeader title="Add a venue" description="About two minutes. You can change everything later." />
      <OnboardingWizard initialCountry={countryOr(requestHeaders.get("x-vercel-ip-country"))} />
    </>
  )
}
