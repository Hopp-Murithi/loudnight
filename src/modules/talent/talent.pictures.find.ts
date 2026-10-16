import "server-only"
import { searchArtists } from "@/lib/deezer/client"
import { searchAlbums } from "@/lib/itunes/client"
import { albumCover, deezerPicture } from "./talent.pictures"

// A picture for each act that has none: their own photo first, else an album cover. Every lookup runs at once and
// fails on its own, so an unreachable service only leaves those acts with the stage photo the card falls back to.
export async function picturesFor(names: string[]): Promise<Map<string, string>> {
  const found = await Promise.all(
    [...new Set(names)].map(async (name) => {
      const photo = await searchArtists(name)
        .then((artists) => deezerPicture(name, artists))
        .catch(() => null)
      const picture =
        photo ??
        (await searchAlbums(name)
          .then((albums) => albumCover(name, albums))
          .catch(() => null))
      return picture ? ([name, picture] as const) : null
    }),
  )
  return new Map(found.flatMap((entry) => (entry ? [entry] : [])))
}
