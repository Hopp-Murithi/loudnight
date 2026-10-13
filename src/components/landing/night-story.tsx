import Image, { type StaticImageData } from "next/image"
import bluesCellar from "@/assets/nights/blues-cellar.webp"
import cocktailBar from "@/assets/nights/cocktail-bar.webp"
import danceFloor from "@/assets/nights/dance-floor.webp"
import djCrowd from "@/assets/nights/dj-crowd.webp"
import pubStage from "@/assets/nights/pub-stage.webp"
import { NIGHT_STORY } from "@/config/landing"
import { TYPE } from "@/lib/typography"

const PHOTOS: StaticImageData[] = [cocktailBar, bluesCellar, pubStage, djCrowd, danceFloor]

// The whole use case as five pictures: a gallery on a laptop, a row to swipe through on a phone.
export function NightStory() {
  return (
    <section aria-labelledby="story-heading" className="space-y-8">
      <div className="reveal space-y-3">
        <h2 id="story-heading" className={TYPE.h1}>
          From an empty Tuesday to a full room.
        </h2>
        <p className={TYPE.lead}>Five steps. Encore does the middle three.</p>
      </div>
      <ol className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0">
        {NIGHT_STORY.map((step, index) => (
          <li
            key={step.title}
            className="reveal group relative aspect-[3/4] w-[68%] shrink-0 snap-center overflow-hidden sm:w-[40%] lg:w-auto"
          >
            <Image
              src={PHOTOS[index % PHOTOS.length]}
              alt=""
              fill
              sizes="(min-width: 1024px) 20vw, 70vw"
              placeholder="blur"
              className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-linear-to-t from-background via-background/55 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
              <span className="font-display text-5xl leading-none font-extrabold text-spotlight tabular-nums">
                {index + 1}
              </span>
              <h3 className="font-display text-2xl leading-none font-bold text-balance">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.line}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
