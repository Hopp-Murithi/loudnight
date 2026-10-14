import Image from "next/image"
import { photoForStep } from "@/config/night-photos"

// A real night out behind the planning stage, changing with the step. The gradient keeps the words readable.
export function StageBackdrop({ step }: { step: string | undefined }) {
  const photo = photoForStep(step)
  return (
    <>
      <Image
        key={photo.source}
        src={photo.image}
        alt=""
        fill
        sizes="(min-width: 1024px) 60vw, 100vw"
        placeholder="blur"
        className="stage-photo object-cover opacity-45 motion-reduce:animate-none"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-linear-to-r from-background via-background/75 to-background/20"
      />
      <span aria-hidden className="absolute inset-0 bg-linear-to-t from-background via-transparent to-background/40" />
      <a
        href={photo.source}
        target="_blank"
        rel="noreferrer"
        className="absolute right-3 bottom-2 z-10 text-[0.65rem] text-white/50 hover:text-white"
      >
        Photo: {photo.author} ({photo.license})
      </a>
    </>
  )
}

// A small equaliser in place of a dot: the plan is playing.
export function StageBeat() {
  return (
    <span aria-hidden className="flex h-3.5 items-end gap-0.5">
      {["0ms", "-160ms", "-320ms"].map((delay, index) => (
        <span
          key={delay}
          className="eq-bar w-1 bg-spotlight motion-reduce:animate-none"
          style={{ height: ["60%", "100%", "75%"][index], animationDelay: delay }}
        />
      ))}
    </span>
  )
}
