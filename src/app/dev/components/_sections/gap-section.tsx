import type { GapScan, Scout } from "@/modules/gap/gap.schemas"
import { GapScanCard } from "@/modules/gap/components/gap-scan-card"
import { GallerySection, Specimen } from "./gallery-section"

// Made-up sample values for checking the layout. Never real upstream data.
const SCOUT: Scout = {
  name: "Sample Bar",
  type: "Cocktail bar",
  rating: 4.4,
  ratingCount: 812,
  hours: ["Monday: Closed", "Tuesday: 5:00 PM to 1:00 AM"],
  website: null,
}

const venue = (index: number, name: string, type: string) => ({
  placeId: `sample-${index}`,
  name,
  type,
  rating: 4 + (index % 9) / 10,
  distanceMetres: 120 * (index + 1),
})

const FULL: GapScan = {
  weekday: "tuesday",
  nights: ["2026-10-13", "2026-10-20", "2026-10-27", "2026-11-03"],
  venues: [
    "Sample Tavern",
    "Sample Lounge",
    "A sample venue with a much longer name than usual",
    "Sample Pub",
    "Sample Club",
    "Sample Hall",
    "Sample Garden",
    "Sample Corner",
  ].map((name, index) => venue(index, name, index % 2 ? "Bar" : "Live music venue")),
  events: [
    { id: "e1", name: "Sample Trivia League", localDate: "2026-10-13", venue: "Sample Tavern", genre: "Games" },
    { id: "e2", name: "Sample Comedy Showcase", localDate: "2026-10-20", venue: "Sample Hall", genre: "Comedy" },
  ],
  themes: [
    { theme: "Trivia", examples: ["Sample Trivia League"], count: 4 },
    { theme: "Stand-up comedy", examples: ["Sample Comedy Showcase"], count: 2 },
    { theme: "Drinks, no programme", examples: [], count: 9 },
  ],
  sources: { places: "ok", events: "ok", themes: "ok" },
  noveltyNeutral: false,
}

const PARTIAL: GapScan = { ...FULL, events: [], venues: [], sources: { places: "failed", events: "ok", themes: "ok" } }
const DOWN: GapScan = {
  ...FULL,
  venues: [],
  events: [],
  themes: [],
  sources: { places: "failed", events: "failed", themes: "failed" },
  noveltyNeutral: true,
}

export function GapSection() {
  return (
    <GallerySection
      title="Competitor gap scan"
      description="Full, partial (Places down, nothing ticketed) and both sources down."
    >
      <Specimen label="Full">
        <GapScanCard scan={FULL} scout={SCOUT} radiusMetres={2000} />
      </Specimen>
      <Specimen label="Partial">
        <GapScanCard scan={PARTIAL} scout={null} radiusMetres={2000} />
      </Specimen>
      <Specimen label="Both down">
        <GapScanCard scan={DOWN} scout={null} radiusMetres={2000} />
      </Specimen>
    </GallerySection>
  )
}
