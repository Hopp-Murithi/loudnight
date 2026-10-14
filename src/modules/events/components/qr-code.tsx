import { qrMatrix } from "@/modules/promote/promote.qr"

// A QR code drawn on the server as plain squares: dark on white in both themes, with a quiet border, so any phone
// camera can read it from a screen or a printed page.
export function QrCode({ value, label }: { value: string; label: string }) {
  const grid = qrMatrix(value)
  const size = grid.length + 8
  const cells = grid.flatMap((row, y) => row.flatMap((dark, x) => (dark ? [`M${x + 4} ${y + 4}h1v1h-1z`] : [])))
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      className="aspect-square w-full max-w-72 bg-white"
      shapeRendering="crispEdges"
    >
      <path d={cells.join("")} className="fill-black" />
    </svg>
  )
}
