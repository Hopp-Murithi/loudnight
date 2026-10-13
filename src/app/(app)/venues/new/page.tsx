import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { getPageContext } from "@/modules/auth/server/context"
import { OnboardingWizard } from "@/modules/venues/components/onboarding-wizard"

export const metadata: Metadata = { title: "Add a venue" }

export default async function NewVenuePage() {
  await getPageContext()
  return (
    <>
      <PageHeader title="Add a venue" description="About two minutes. You can change everything later." />
      <OnboardingWizard />
    </>
  )
}
