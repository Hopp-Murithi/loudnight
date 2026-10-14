// The on-the-night jobs only the owner can confirm. Everything else on the checklist is read from what exists.
export const LOGISTICS = [
  { id: "staff", label: "Staff booked for the night" },
  { id: "soundcheck", label: "Arrival and sound check time agreed with the act" },
  { id: "special", label: "Food or drinks special decided" },
  { id: "door", label: "Someone on the door to check guests in" },
  { id: "payments", label: "Float and card reader ready" },
] as const

export type LogisticsId = (typeof LOGISTICS)[number]["id"]
