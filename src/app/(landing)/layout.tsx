import { PublicShell } from "@/components/layout/public-shell"

export default function LandingLayout({ children }: LayoutProps<"/">) {
  return <PublicShell bleed>{children}</PublicShell>
}
