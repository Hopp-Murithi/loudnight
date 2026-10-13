import { PublicShell } from "@/components/layout/public-shell"
import { hasAccountSession } from "@/modules/auth/server/context"

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  return <PublicShell signedIn={await hasAccountSession()}>{children}</PublicShell>
}
