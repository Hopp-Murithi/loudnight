import Image from "next/image"
import Link from "next/link"
import pubStage from "@/assets/nights/pub-stage.webp"
import { Button } from "@/components/ui/button"
import { ROUTES, SITE } from "@/config/site"
import { TYPE } from "@/lib/typography"
import { FilmPlayer } from "./film-player"

// Always night, in both themes: the page opens where the problem lives, in a dim room on a quiet Tuesday.
export function LandingHero() {
  return (
    <section aria-labelledby="hero-heading" className="dark relative overflow-hidden bg-background text-foreground">
      <Image src={pubStage} alt="" fill priority sizes="100vw" placeholder="blur" className="object-cover opacity-55" />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-r from-background via-background/85 to-background/40 lg:via-background/70"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-16 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-14 lg:pb-24">
        <div className="space-y-6">
          <span aria-hidden className="block h-1.5 w-16 bg-spotlight" />
          <h1 id="hero-heading" className={TYPE.display}>
            {SITE.tagline}
          </h1>
          <p className={TYPE.lead}>{SITE.description}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" nativeButton={false} render={<Link href={ROUTES.signup} />}>
              Plan your quiet night
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="#demo-heading" />}>
              See a demo venue
            </Button>
          </div>
        </div>
        <FilmPlayer />
      </div>
    </section>
  )
}
