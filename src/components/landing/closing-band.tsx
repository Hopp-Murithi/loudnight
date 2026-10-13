import Image from "next/image"
import Link from "next/link"
import danceFloor from "@/assets/nights/dance-floor.webp"
import { PhotoCredits } from "@/components/layout/nights-gallery"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/site"
import { TYPE } from "@/lib/typography"

// The full room, last. The photo credits sit here because the landing page shows the photos.
export function ClosingBand() {
  return (
    <section aria-labelledby="closing-heading" className="dark relative overflow-hidden bg-background text-foreground">
      <Image
        src={danceFloor}
        alt=""
        fill
        sizes="100vw"
        placeholder="blur"
        loading="eager"
        className="object-cover opacity-60"
      />
      <div aria-hidden className="absolute inset-0 bg-linear-to-r from-background via-background/75 to-background/20" />
      <div className="relative mx-auto max-w-6xl space-y-6 px-4 py-20 sm:px-6 sm:py-28">
        <span aria-hidden className="block h-1.5 w-16 bg-spotlight" />
        <h2 id="closing-heading" className={`${TYPE.display} max-w-3xl`}>
          Next Tuesday could look like this.
        </h2>
        <p className={TYPE.lead}>Add your venue and see three nights your neighbourhood is waiting for, in minutes.</p>
        <Button size="lg" nativeButton={false} render={<Link href={ROUTES.signup} />}>
          Plan your quiet night
        </Button>
        <div className="pt-6">
          <PhotoCredits />
        </div>
      </div>
    </section>
  )
}
