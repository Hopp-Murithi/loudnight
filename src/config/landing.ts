import readyAct from "@/assets/landing/ready-act.webp"
import readyDoor from "@/assets/landing/ready-door.webp"
import readyPosts from "@/assets/landing/ready-posts.webp"
import readyPoster from "@/assets/landing/ready-poster.webp"

// The landing page is one stage and five scenes. Each scroll moves the story on; the words never scroll away.

export const STAGE_SCENES = [
  {
    id: "world",
    title: "Every venue has a quiet night.",
    line: "Loudnight finds the night your area is missing, then helps you fill it. Anywhere in the world.",
  },
  {
    id: "area",
    title: "It starts with the people around you.",
    line: "Loudnight reads what your area loves: the music, the food, the nights out.",
  },
  {
    id: "room",
    title: "Then it finds the night nobody nearby runs.",
    line: "Three ideas for your room, each scored, each with proof you can open.",
  },
  {
    id: "lights",
    title: "And fills it.",
    line: "Local acts who already have fans near you, posters and posts in a tap, a guest list at the door.",
  },
  {
    id: "anywhere",
    title: "Quiet nights, filled. Anywhere.",
    // Replaced by the visitor's own towns (config/landing-regions.ts).
    line: "Start with your address.",
  },
] as const

export type StageSceneId = (typeof STAGE_SCENES)[number]["id"]

// What the night Loudnight found brings with it, each shown as the real screen it comes from.
export const NIGHT_READY = [
  { label: "A local act, booked", image: readyAct, alt: "A booked local band on its performer card" },
  { label: "A poster with a ticket QR", image: readyPoster, alt: "A poster showing two bands and a ticket QR code" },
  { label: "Posts for every channel", image: readyPosts, alt: "Instagram captions written from the night's details" },
  { label: "A guest list at the door", image: readyDoor, alt: "The door screen counting guests against break-even" },
] as const
