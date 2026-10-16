import { PICTURES } from "@/config/integrations"
import type { DeezerArtist } from "@/lib/deezer/client"
import type { ItunesAlbum } from "@/lib/itunes/client"

// Names compared without case, accents, punctuation or a leading "the", so "Nikita Kering’" matches "Nikita Kering".
export const sameName = (a: string, b: string) => {
  const plain = (name: string) =>
    name
      .normalize("NFD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/^the /, "")
  return plain(a) === plain(b)
}

const allowed = (url: string | null | undefined): url is string => {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:" && (PICTURES.hosts as readonly string[]).includes(parsed.hostname)
  } catch {
    return false
  }
}

// The best-followed Deezer artist with exactly this name. Deezer's blank silhouette has no image id in its address.
export function deezerPicture(name: string, artists: DeezerArtist[]): string | null {
  const match = artists
    .filter((artist) => sameName(artist.name, name) && allowed(artist.picture_xl))
    .filter((artist) => !artist.picture_xl?.includes("/artist//"))
    .sort((a, b) => (b.nb_fan ?? 0) - (a.nb_fan ?? 0))[0]
  return match?.picture_xl ?? null
}

// An album cover by exactly this artist, at a size a card can use.
export function albumCover(name: string, albums: ItunesAlbum[]): string | null {
  const album = albums.find((entry) => sameName(entry.artistName, name) && allowed(entry.artworkUrl100))
  return album?.artworkUrl100?.replace(/\/100x100bb\./, "/600x600bb.") ?? null
}
