import { QrCode } from "@/modules/events/components/qr-code"
import { selfCheckinUrl } from "@/modules/events/events.links"

// The QR to print and tape by the door. Guests scan it with their own camera to count themselves in.
export function DoorQr({ slug, title }: { slug: string; title: string }) {
  return (
    <details className="mx-auto max-w-xl border bg-card">
      <summary className="cursor-pointer p-4 font-medium">Door QR for guests to check themselves in</summary>
      <div className="grid place-items-center gap-3 border-t p-5 text-center">
        <div className="bg-white p-4">
          <QrCode value={selfCheckinUrl(slug)} label={`Self check-in QR for ${title}`} />
        </div>
        <p className="text-sm text-muted-foreground">
          Print this page and put it by the door. It works from an hour before the start to six hours after.
        </p>
      </div>
    </details>
  )
}
