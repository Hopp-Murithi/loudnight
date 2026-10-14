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
    line: "Nairobi or Nyeri, Lagos or London, Brooklyn or Tokyo. Start with your address.",
  },
] as const

export type StageSceneId = (typeof STAGE_SCENES)[number]["id"]

// Map pins as percentages of the dotted maps in `public/landing`, generated once with dotted-map (plan 21).
export const WORLD_PINS = [
  { name: "Nairobi", x: 60.71, y: 59.77 },
  { name: "Lagos", x: 50.36, y: 56.11 },
  { name: "London", x: 49.64, y: 24.4 },
  { name: "Brooklyn", x: 27.86, y: 32.93 },
  { name: "Mexico City", x: 20, y: 47.57 },
  { name: "Sao Paulo", x: 36.07, y: 73.19 },
  { name: "Tokyo", x: 90.71, y: 37.81 },
  { name: "Mumbai", x: 71.43, y: 47.57 },
  { name: "Johannesburg", x: 57.86, y: 74.4 },
  { name: "Berlin", x: 53.57, y: 23.18 },
  { name: "Austin", x: 21.07, y: 41.47 },
  { name: "Sydney", x: 94.64, y: 80.5 },
  { name: "Dubai", x: 66.07, y: 43.91 },
] as const

export const WORLD_FOCUS = WORLD_PINS[0]

export const KENYA_PINS = [
  { name: "Nairobi", x: 36.62, y: 65.67 },
  { name: "Nyeri", x: 38.73, y: 57.1 },
  { name: "Mombasa", x: 73.24, y: 92.31 },
  { name: "Kisumu", x: 11.27, y: 54.25 },
  { name: "Nakuru", x: 26.76, y: 56.15 },
  { name: "Eldoret", x: 16.9, y: 48.54 },
] as const

// What an area's taste reads like, in words. Illustration only: real plans show Qloo's own answers with receipts.
export const AREA_TASTES = ["Afropop", "Bongo flava", "Live soul", "Kenyan hip hop", "Rooftop nights", "Nyama choma"]

// The night Encore suggests in the story, and what it brings with it.
export const STORY_NIGHT = {
  name: "Afro Soul Supper",
  when: "Thursdays at 8 PM, four weeks",
  ready: ["A local act, booked", "A poster with a ticket QR", "Posts for every channel", "A guest list at the door"],
} as const
