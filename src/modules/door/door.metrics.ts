// What a night's guest list and door add up to. Pure, so the door, the dashboard and the tests agree.

export interface ListedGuest {
  id: string
  partySize: number
}

export interface Arrival {
  rsvpId: string | null
  partySize: number
}

export interface NightNumbers {
  // Places saved: RSVPs, and the people they bring.
  rsvps: number
  rsvpPeople: number
  // People through the door, from RSVPs and walk-ins together.
  arrived: number
  walkIns: number
  // Of the RSVPs, the share that turned up (null before anyone RSVPs).
  showUpRate: number | null
  // People still needed to break even; zero once it is reached.
  toBreakEven: number
  // People through the door times the average spend, unless the owner logged the night's real takings.
  takingsCents: number
  takingsLogged: boolean
}

export function nightNumbers(input: {
  guests: ListedGuest[]
  arrivals: Arrival[]
  breakEven: number
  averageSpendCents: number
  loggedSpendCents: number | null
}): NightNumbers {
  const arrivedRsvps = new Set(input.arrivals.flatMap((arrival) => (arrival.rsvpId ? [arrival.rsvpId] : [])))
  const arrived = input.arrivals.reduce((sum, arrival) => sum + arrival.partySize, 0)
  const walkIns = input.arrivals
    .filter((arrival) => !arrival.rsvpId)
    .reduce((sum, arrival) => sum + arrival.partySize, 0)
  const rsvps = input.guests.length
  return {
    rsvps,
    rsvpPeople: input.guests.reduce((sum, guest) => sum + guest.partySize, 0),
    arrived,
    walkIns,
    showUpRate: rsvps === 0 ? null : input.guests.filter((guest) => arrivedRsvps.has(guest.id)).length / rsvps,
    toBreakEven: Math.max(0, input.breakEven - arrived),
    takingsCents: input.loggedSpendCents ?? arrived * input.averageSpendCents,
    takingsLogged: input.loggedSpendCents !== null,
  }
}

// The pitch in the owner's own numbers: extra guests every week, at their spend, over a month of four nights.
export const monthlyGain = (extraGuests: number, spendCents: number, nights = 4) =>
  Math.max(0, extraGuests) * Math.max(0, spendCents) * nights

// How many times a month's gain pays for Loudnight.
export const paysFor = (gainCents: number, priceCents: number) =>
  priceCents > 0 ? Math.floor(gainCents / priceCents) : 0
