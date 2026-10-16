import { describe, expect, it } from "vitest"
import { albumCover, deezerPicture, sameName } from "./talent.pictures"

// Made-up search answers in the shape Deezer and iTunes return.
const photo = (id: string) => `https://cdn-images.dzcdn.net/images/artist/${id}/1000x1000-000000-80-0-0.jpg`

describe("performer pictures", () => {
  it("matches names whatever their case, accents or punctuation", () => {
    expect(sameName("Nikita Kering’", "nikita kering")).toBe(true)
    expect(sameName("The Texas Gentlemen", "Texas Gentlemen")).toBe(true)
    expect(sameName("Beyoncé", "Beyonce")).toBe(true)
    expect(sameName("Bensoul", "Benson Boone")).toBe(false)
  })

  it("takes the best-followed artist with the same name, never a near miss or the blank silhouette", () => {
    const artists = [
      { name: "Nikita Kering", nb_fan: 113, picture_xl: photo("small") },
      { name: "Nikita Kering", nb_fan: 3553, picture_xl: photo("main") },
      { name: "Nikita Keringo", nb_fan: 90000, picture_xl: photo("other") },
    ]
    expect(deezerPicture("Nikita Kering", artists)).toBe(photo("main"))
    expect(deezerPicture("Ada", [{ name: "Ada", nb_fan: 5, picture_xl: photo("") }])).toBeNull()
    expect(deezerPicture("Ada", [{ name: "Ada", nb_fan: 5, picture_xl: "https://evil.example/a.jpg" }])).toBeNull()
  })

  it("falls back to an album cover by that same artist, made large enough for a card", () => {
    const albums = [
      { artistName: "Bensoul, Sauti Sol", artworkUrl100: "https://is1-ssl.mzstatic.com/a/100x100bb.jpg" },
      { artistName: "Bensoul", artworkUrl100: "https://is1-ssl.mzstatic.com/b/100x100bb.jpg" },
    ]
    expect(albumCover("Bensoul", albums)).toBe("https://is1-ssl.mzstatic.com/b/600x600bb.jpg")
    expect(albumCover("Nobody", albums)).toBeNull()
  })
})
