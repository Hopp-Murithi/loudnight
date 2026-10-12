import { cookies } from "next/headers"
import { AppShell } from "@/components/layout/app-shell"
import { getPageContext } from "@/modules/auth/server/context"

// Venue context and the switcher arrive with plan 03; until then the shell shows the signed-in frame alone.
export default async function SignedInLayout({ children }: LayoutProps<"/">) {
  const [{ user }, cookieStore] = await Promise.all([getPageContext(), cookies()])
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <AppShell user={user} defaultOpen={defaultOpen}>
      {children}
    </AppShell>
  )
}
