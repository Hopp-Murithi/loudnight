import type { StaticImageData } from "next/image"
import bluesCellar from "@/assets/nights/blues-cellar.webp"
import cocktailBar from "@/assets/nights/cocktail-bar.webp"
import danceFloor from "@/assets/nights/dance-floor.webp"
import djCrowd from "@/assets/nights/dj-crowd.webp"
import pubStage from "@/assets/nights/pub-stage.webp"

export interface NightPhoto {
  image: StaticImageData
  alt: string
  author: string
  license: "CC0" | "CC BY 2.0"
  source: string
}

// Real venue nights from Wikimedia Commons, CC0 or CC BY 2.0. Credited on every page that shows them.
export const NIGHT_PHOTOS: NightPhoto[] = [
  {
    image: bluesCellar,
    alt: "A blues band playing to a small crowd in a brick pub cellar",
    author: "DimiTalen",
    license: "CC0",
    source:
      "https://commons.wikimedia.org/wiki/File:Blues_band_in_the_cellar_of_Wirstr%C3%B6ms_Pub,_Stockholm,_2022.jpg",
  },
  {
    image: cocktailBar,
    alt: "A bartender serving guests along a busy cocktail bar",
    author: "Kartoman",
    license: "CC0",
    source: "https://commons.wikimedia.org/wiki/File:Bartender_at_Sylvarum_cocktail_bar,_Alicante.jpg",
  },
  {
    image: pubStage,
    alt: "A band on a small pub stage under purple lights",
    author: "Zeddawg02",
    license: "CC0",
    source: "https://commons.wikimedia.org/wiki/File:Plush_at_The_Jameson_Pub_(1).jpg",
  },
  {
    image: djCrowd,
    alt: "A DJ playing to a packed room from behind the decks",
    author: "Arnold Jaeger Werner",
    license: "CC BY 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Bob_Beaman_Nightclub_Munich_1.jpg",
  },
  {
    image: danceFloor,
    alt: "A dance floor full of people under red and blue light",
    author: "JasonParis",
    license: "CC BY 2.0",
    source: "https://commons.wikimedia.org/wiki/File:SchwuZ_Nightclub_Berlin_Dancing.jpg",
  },
]

export const NIGHT_SLIDE_SECONDS = 6

// Each venue keeps the same photo everywhere, chosen from its id so it never changes between visits.
export function photoForVenue(venueId: string): NightPhoto {
  const sum = [...venueId].reduce((total, char) => total + char.charCodeAt(0), 0)
  return NIGHT_PHOTOS[sum % NIGHT_PHOTOS.length]
}
