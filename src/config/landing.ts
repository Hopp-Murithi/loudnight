// The landing page is one stage and five scenes. Each scroll moves the story on; the words never scroll away.

export const STAGE_SCENES = [
  {
    id: "world",
    title: "Every venue has a quiet night.",
    line: "Encore finds the night your area is missing, then helps you fill it. Anywhere in the world.",
  },
  {
    id: "area",
    title: "It starts with the people around you.",
    line: "Encore reads what your area loves: the music, the food, the nights out.",
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

// What the night Encore found brings with it. The night's own name comes from the visitor's region.
export const NIGHT_READY = [
  "A local act, booked",
  "A poster with a ticket QR",
  "Posts for every channel",
  "A guest list at the door",
] as const
