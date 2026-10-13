import { PublicShell } from "@/components/layout/public-shell"
import { hasAccountSession } from "@/modules/auth/server/context"

export default async function LandingLayout({ children }: LayoutProps<"/">) {
  return (
    <PublicShell bleed signedIn={await hasAccountSession()}>
      {children}
    </PublicShell>
  )
}
