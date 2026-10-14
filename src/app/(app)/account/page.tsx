import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { getPageContext } from "@/modules/auth/server/context"
import { AccountForm, SignOutButton } from "@/modules/auth/components/account-forms"
import { SetPasswordForm } from "@/modules/auth/components/set-password-form"

export const metadata: Metadata = { title: "Account" }

export default async function AccountPage() {
  const { user } = await getPageContext()

  return (
    <>
      <PageHeader title="Account" description={user.email ?? "Your Loudnight account"} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Your name" description="Shown to your venue team.">
          <AccountForm displayName={user.displayName ?? ""} />
        </SectionCard>
        <SectionCard title="Password" description="Choose a new password for signing in.">
          <SetPasswordForm submitLabel="Change password" />
        </SectionCard>
        <SectionCard title="Sign out" description="End your session on this device.">
          <SignOutButton />
        </SectionCard>
      </div>
    </>
  )
}
