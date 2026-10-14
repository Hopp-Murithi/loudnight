import { qrMatrix } from "@/modules/promote/promote.qr"
import { ticketPayload } from "../events.codes"

// The ticket's QR, drawn on the server as plain squares: dark on white in both themes, with a quiet border, so any
// phone camera at the door can read it.
export function TicketQr({ code }: { code: string }) {
  const grid = qrMatrix(ticketPayload(code))
  const size = grid.length + 8
  const cells = grid.flatMap((row, y) => row.flatMap((dark, x) => (dark ? [`M${x + 4} ${y + 4}h1v1h-1z`] : [])))
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Ticket QR code for ${code}`}
      className="aspect-square w-full max-w-72 bg-white"
      shapeRendering="crispEdges"
    >
      <path d={cells.join("")} className="fill-black" />
    </svg>
  )
}
