"use client"

import { NightStrip } from "@/modules/series/components/night-strip"
import type { NightView, TalentView } from "@/modules/series/series.schemas"
import { TalentShortlist } from "@/modules/talent/components/talent-shortlist"
import { GallerySection, Specimen } from "./gallery-section"

// Made-up sample values for checking the layout. Never real upstream data.
const TWISTS = [
  "Opening night: the idea in full, with a welcome for everyone who walks in.",
  "A guest joins in: a second act chosen for the same crowd.",
  "A menu special made to match the night.",
  "Bring a friend: regulars bring someone new for the finale.",
]

const NIGHTS: NightView[] = ["2026-10-20", "2026-10-27", "2026-11-03", "2026-11-10"].map((localDate, index) => ({
  id: `night-${index}`,
  sequence: index + 1,
  startsAt: `${localDate}T23:00:00Z`,
  localDate,
  localTime: "20:00",
  variation: TWISTS[index],
  status: index === 0 ? "published" : "draft",
  slug: `sample-night-${index + 1}`,
}))

const act = (id: string, name: string, tier: TalentView["tier"], overlap: number): TalentView => ({
  id,
  name,
  tier,
  overlap,
  fitSignals: ["Sample soul", "Sample folk"],
  message: "Hi, this is Sample Room. Are you free on Tuesday, October 20?",
  edited: false,
  hasReceipt: true,
  booked: id === "b",
  bookedAt: id === "b" ? "2026-10-13T10:00:00Z" : null,
  source: id === "a" ? "both" : id === "b" ? "area" : "night",
  reach: id === "c" ? "stretch" : "within",
  profile: {
    imageUrl: null,
    tagline: "A sample act known for sample songs and a warm live show.",
    knownFor: "Their sample live shows in small rooms.",
    genres: ["Sample Soul", "Sample Folk"],
    songs: ["Sample One", "Sample Two"],
    isGroup: false,
    listeners: 34500,
    origin: id === "a" ? "Sample Town, Sample Country" : null,
    star: false,
    channels: [{ id: "instagram", label: "Instagram", url: "https://www.instagram.com/" }],
  },
})

const TALENT = [
  act("a", "Sample Act One", "local", 0.94),
  act("b", "A Sample Act With A Long Name", "emerging", 0.91),
  act("c", "Sample Three", "regional", 0.88),
]

export function SeriesSection() {
  return (
    <GallerySection
      title="Series and performers"
      description="The four weeks with one published night, the shortlist an owner sees, and the read-only one with no close matches."
    >
      <Specimen label="Four weeks, editable">
        <div className="w-full min-w-0">
          <NightStrip nights={NIGHTS} timeZone="America/New_York" canEdit />
        </div>
      </Specimen>
      <Specimen label="Shortlist, owner">
        <div className="w-full min-w-0">
          <TalentShortlist
            seriesId="series"
            nightName="Sample Night"
            talent={TALENT}
            references={[act("z", "Sample Star", "national", 0.99)]}
            canEdit
          />
        </div>
      </Specimen>
      <Specimen label="No close matches, read only">
        <div className="w-full min-w-0">
          <TalentShortlist
            seriesId="series"
            nightName="Sample Night"
            talent={[]}
            references={[act("z", "Sample Star", "national", 0.99)]}
            canEdit={false}
          />
        </div>
      </Specimen>
    </GallerySection>
  )
}
