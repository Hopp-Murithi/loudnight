import type { ReactNode } from "react"
import { SITE } from "@/config/site"
import { Brand } from "./brand"
import { SkipLink } from "./skip-link"
import { ThemeToggle } from "./theme-toggle"

// The frame for everything a guest or judge sees without an account: landing, demo, event and door pages.
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Brand />
        <ThemeToggle />
      </header>
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-20 outline-none sm:px-6 sm:pt-14"
      >
        {children}
      </main>
      <footer className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground sm:px-6">{SITE.credit}</p>
      </footer>
    </div>
  )
}
