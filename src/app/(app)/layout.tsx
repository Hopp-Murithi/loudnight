import { cookies } from "next/headers"
import { AppShell } from "@/components/layout/app-shell"
import { getPageContext } from "@/modules/auth/server/context"
import { venuesService } from "@/modules/venues/venues.service"

export default async function SignedInLayout({ children }: LayoutProps<"/">) {
  const [ctx, cookieStore] = await Promise.all([getPageContext(), cookies()])
  const venues = await venuesService.listMine(ctx)
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <AppShell user={ctx.user} defaultOpen={defaultOpen} venues={venues} preview={ctx.preview}>
      {children}
    </AppShell>
  )
}
