import { TYPE, type TypeRole } from "@/lib/typography"
import { cn } from "@/lib/utils"
import { GallerySection, Specimen } from "./gallery-section"

const SAMPLES: Record<TypeRole, string> = {
  display: "Fill your quiet nights.",
  h1: "Your venues",
  h2: "From an empty night to a full room",
  h3: "Afrobeats Tuesday",
  lead: "Encore reads your neighbourhood's taste and finds the night nobody nearby is running.",
  body: "Four dates with a twist each week, performers whose fans live nearby, and a message drafted for each one.",
  caption: "Fetched from Qloo at 20:14",
  number: "32 of 40",
}

const SWATCHES = [
  ["Primary", "bg-primary text-primary-foreground"],
  ["Spotlight", "bg-spotlight text-sidebar-primary-foreground"],
  ["Background", "bg-background text-foreground border"],
  ["Muted", "bg-muted text-muted-foreground"],
  ["Accent", "bg-accent text-accent-foreground"],
  ["Success", "bg-success text-background"],
  ["Warning", "bg-warning text-background"],
  ["Destructive", "bg-destructive text-background"],
  ["Info", "bg-info text-background"],
  ["Sidebar", "bg-sidebar text-sidebar-foreground"],
] as const

const RULES = [
  ["Gutters", "px-4 on phones, px-6 from 640px. Content max width 1200px."],
  ["Sections", "space-y-8 on phones, space-y-12 and up on larger screens."],
  ["Radius", "0.25rem everywhere. Circles only for avatars, the loader and QR finder marks."],
  ["Motion", "FadeIn for entrances, 60ms stagger, nothing over 500ms, off under reduced motion."],
  ["Display face", "Big Shoulders for the display line and page titles only. Geist for everything else."],
] as const

export function FoundationsSection() {
  return (
    <GallerySection title="Foundations" description="Type scale, colour tokens and the spacing and motion rules.">
      <div className="space-y-6">
        {(Object.keys(SAMPLES) as TypeRole[]).map((role) => (
          <Specimen key={role} label={`TYPE.${role}`}>
            <p className={cn(TYPE[role], "min-w-0")}>{SAMPLES[role]}</p>
          </Specimen>
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {SWATCHES.map(([name, classes]) => (
          <li key={name} className={cn("flex h-20 items-end p-3 text-sm font-medium", classes)}>
            {name}
          </li>
        ))}
      </ul>
      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
        {RULES.map(([term, rule]) => (
          <div key={term} className="contents">
            <dt className="font-medium">{term}</dt>
            <dd className="text-muted-foreground">{rule}</dd>
          </div>
        ))}
      </dl>
    </GallerySection>
  )
}
