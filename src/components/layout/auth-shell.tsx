import type { ReactNode } from "react"
import { SITE } from "@/config/site"
import { TYPE } from "@/lib/typography"
import { Brand } from "./brand"
import { NightsGallery, PhotoCredits } from "./nights-gallery"
import { SkipLink } from "./skip-link"
import { ThemeToggle } from "./theme-toggle"

// Sign up, sign in and every emailed link land here: real venue nights on the left on desktop, the form alone on phones.
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <SkipLink />
      <aside className="relative hidden overflow-hidden text-white lg:block">
        <NightsGallery />
        <div className="relative flex h-full min-h-dvh flex-col justify-between gap-10 p-12">
          <Brand className="text-white focus-visible:ring-offset-black" />
          <div className="max-w-lg space-y-5">
            <span aria-hidden className="block h-1.5 w-16 bg-spotlight" />
            <p className={TYPE.display}>{SITE.tagline}</p>
            <p className="text-lg text-white/85">{SITE.description}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-white/75">{SITE.credit}</p>
            <PhotoCredits />
          </div>
        </div>
      </aside>
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-4 py-4 sm:px-6">
          <Brand className="lg:invisible" />
          <ThemeToggle />
        </header>
        <main
          id="content"
          tabIndex={-1}
          className="flex flex-1 items-center justify-center px-4 pb-16 outline-none sm:px-6"
        >
          <div className="w-full max-w-sm space-y-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

export function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <header className="space-y-2">
      <h1 className={TYPE.h1}>{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </header>
  )
}
