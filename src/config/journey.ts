import { CalendarDays, DoorOpen, Lightbulb, MapPin, Megaphone, Radar, type LucideIcon } from "lucide-react"

export interface JourneyStep {
  title: string
  description: string
  icon: LucideIcon
}

// The owner's path from an empty Tuesday to a measured night, as the landing page tells it.
export const OWNER_JOURNEY: JourneyStep[] = [
  {
    title: "Tell us about your venue",
    description: "Your address, your quiet night, how many people you need to break even, and what the room can host.",
    icon: MapPin,
  },
  {
    title: "Watch it read the neighbourhood",
    description:
      "What people within walking distance love across music, film, food and brands, and what nearby venues already run.",
    icon: Radar,
  },
  {
    title: "Pick one of three nights",
    description:
      "Each concept shows the taste data behind it, a fit score, the cost, and why it beats what is on nearby.",
    icon: Lightbulb,
  },
  {
    title: "Get a four-week series",
    description:
      "Four dates with a twist each week, performers whose fans live nearby, and a message drafted for each one.",
    icon: CalendarDays,
  },
  {
    title: "Launch it in one tap",
    description:
      "An event page with RSVP and a QR code, a poster, posts for every channel, menu specials and an ad brief.",
    icon: Megaphone,
  },
  {
    title: "See who came",
    description:
      "Guests check in at the door. Turnout against break-even decides whether next week keeps, tweaks or swaps.",
    icon: DoorOpen,
  },
]
