import Image from "next/image"
import { photoForVenue } from "@/config/night-photos"
import { initials } from "@/lib/text"

const SIZES = "(min-width: 1280px) 24rem, (min-width: 640px) 50vw, 100vw"
const ZOOM = "transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"

// The act's own photo or album cover. With neither anywhere, a stage photo with their initials, so a card is never blank.
export function ActPicture({ id, name, imageUrl }: { id: string; name: string; imageUrl: string | null }) {
  if (imageUrl)
    return <Image src={imageUrl} alt="" fill sizes={SIZES} className={`object-cover object-[center_18%] ${ZOOM}`} />
  return (
    <>
      <Image
        src={photoForVenue(id).image}
        alt=""
        fill
        sizes={SIZES}
        placeholder="blur"
        className={`object-cover opacity-60 ${ZOOM}`}
      />
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center font-display text-7xl font-extrabold text-foreground/70"
      >
        {initials(name)}
      </span>
    </>
  )
}
