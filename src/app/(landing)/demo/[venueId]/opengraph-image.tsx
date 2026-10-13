import { ImageResponse } from "next/og"
import { BRAND_COLOURS } from "@/config/brand"
import { SITE } from "@/config/site"
import { WEEKDAY_LABELS } from "@/config/venues"
import { cityOf } from "@/lib/address"
import { createServerSupabase } from "@/lib/supabase/server"
import { readDemoPlan } from "@/modules/demo/demo.service"

export const alt = "A demo venue planned by Encore"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function DemoShareImage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params
  const { venue, concepts } = await readDemoPlan(await createServerSupabase(), venueId)
  const top = concepts[0]
  const where = cityOf(venue.address)

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        color: BRAND_COLOURS.paper,
        background: `radial-gradient(circle at 85% 0%, ${BRAND_COLOURS.copper}, ${BRAND_COLOURS.ink} 62%)`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30 }}>
        <span style={{ fontWeight: 700 }}>{SITE.name}</span>
        <span style={{ color: BRAND_COLOURS.spotlight }}>Quiet night: {WEEKDAY_LABELS[venue.slowNight]}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <span style={{ fontSize: 30, opacity: 0.75 }}>{where ? `${venue.name}, ${where}` : venue.name}</span>
        <span style={{ fontSize: 96, fontWeight: 800, lineHeight: 1 }}>{top ? top.name : venue.name}</span>
        <span style={{ fontSize: 30, opacity: 0.75 }}>
          {top ? "The night nobody nearby is running, with the evidence behind it." : SITE.tagline}
        </span>
      </div>
    </div>,
    size,
  )
}
