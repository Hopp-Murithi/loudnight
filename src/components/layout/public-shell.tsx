import Link from "next/link"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ROUTES, SIGNED_IN_HOME, SITE } from "@/config/site"
import { cn } from "@/lib/utils"
import { Brand } from "./brand"
import { SkipLink } from "./skip-link"
import { ThemeToggle } from "./theme-toggle"

// The frame for everything a guest or judge sees without an account: landing, demo, event and door pages.
// `bleed` lets a page run full-width bands under a night header; it then sets its own widths.
interface PublicShellProps {
  children: ReactNode
  bleed?: boolean
  signedIn?: boolean
}

export function PublicShell({ children, bleed = false, signedIn = false }: PublicShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <div className={cn(bleed && "dark bg-background text-foreground")}>
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Brand />
          <nav aria-label="Account" className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {signedIn ? (
              <Button nativeButton={false} render={<Link href={SIGNED_IN_HOME} />}>
                Your venues
              </Button>
            ) : (
              <>
                <Button variant="ghost" nativeButton={false} render={<Link href={ROUTES.login} />}>
                  Sign in
                </Button>
                <Button nativeButton={false} render={<Link href={ROUTES.signup} />} className="hidden sm:inline-flex">
                  Create an account
                </Button>
              </>
            )}
          </nav>
        </header>
      </div>
      <main
        id="content"
        tabIndex={-1}
        className={cn("flex-1 outline-none", !bleed && "mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-6 sm:pt-14")}
      >
        {children}
      </main>
      <footer className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground sm:px-6">{SITE.credit}</p>
      </footer>
    </div>
  )
}
