// The shapes the Loudnight API returns, mirrored from the web app (src/modules/door/door.schemas.ts).
export interface Venue {
  id: string
  name: string
  city: string | null
  address: string
  role: "owner" | "manager" | "door"
}

export interface DoorGuest {
  id: string
  name: string
  partySize: number
  arrivedAt: string | null
}

export interface DoorArrival {
  id: string
  name: string | null
  partySize: number
  at: string
}

export interface DoorView {
  night: { id: string; slug: string; title: string; startsAt: string; status: string; timeZone: string }
  breakEven: number | null
  guests: DoorGuest[]
  recent: DoorArrival[]
  numbers: {
    rsvps: number
    rsvpPeople: number
    arrived: number
    walkIns: number
    showUpRate: number | null
    toBreakEven: number
  }
}

// What the door sends: the raw text a ticket QR holds (the server reads the code from it), a guest, or a walk-in.
export type CheckinBody = { code: string } | { rsvpId: string } | { walkIn: true; partySize: number; clientKey: string }

export interface CheckinResult {
  status: "in" | "already"
  name: string
  partySize: number
  at: string
}
