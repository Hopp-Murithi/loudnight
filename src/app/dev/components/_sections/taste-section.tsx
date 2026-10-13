import type { TasteFingerprint } from "@/modules/taste/taste.schemas"
import { TasteFingerprintCard } from "@/modules/taste/components/taste-fingerprint-card"
import { GallerySection } from "./gallery-section"

const CACHE_ID = "00000000-0000-4000-8000-000000000000"
const receipt = (index: number) => ({
  cacheId: CACHE_ID,
  path: ["results", "tags", String(index), "query", "affinity"],
})
const item = (name: string, affinity: number, index: number) => ({
  id: `sample-${name}`,
  name,
  affinity,
  score: 1 - index / 4,
  popularity: null,
  receipt: receipt(index),
})

// Made-up sample values for checking the layout. Never real Qloo data.
const SAMPLE: TasteFingerprint = {
  domains: [
    {
      domain: "music_styles",
      label: "Music styles",
      status: "ok",
      items: [
        "Sample soul",
        "Sample folk",
        "Sample jazz",
        "A much longer sample style name that wraps",
        "Sample funk",
      ].map((name, index) => item(name, 0.99 - index * 0.01, index)),
    },
    { domain: "place_styles", label: "Kinds of night out", status: "ok", items: [item("Sample wine bar", 0.98, 0)] },
    { domain: "podcasts", label: "Podcasts", status: "empty", items: [] },
    { domain: "books", label: "Books", status: "failed", items: [] },
  ],
  audience: {
    basedOn: [{ id: "sample", name: "Sample soul" }],
    age: [
      { key: "24_and_younger", label: "24 and under", value: 0.62, receipt: receipt(0) },
      { key: "35_to_44", label: "35 to 44", value: -0.24, receipt: receipt(0) },
      { key: "55_and_older", label: "55 and over", value: -0.71, receipt: receipt(0) },
    ],
    gender: [
      { key: "female", label: "Women", value: 0.3, receipt: receipt(0) },
      { key: "male", label: "Men", value: -0.3, receipt: receipt(0) },
    ],
  },
}

export function TasteSection() {
  return (
    <GallerySection
      title="Taste fingerprint"
      description="Results, an empty domain and a failed domain, with sample values."
    >
      <TasteFingerprintCard fingerprint={SAMPLE} />
    </GallerySection>
  )
}
