# Plan 31: What is trending near the venue

Status: Research plan (Oct 14). Nothing is built. Each source needs checking before it is promised.
Depends on: 04 (taste fingerprint), 06 (concepts), 29
Phase: after the hackathon (roadmap), with one slice possible before it
Judging criteria: Potential Impact

## Goal

Taste changes slowly; trends change weekly. An owner planning a Thursday wants to know both: what people near them have loved for years (Qloo, today) and what they are talking about this month (a sound going round on TikTok, a song climbing the country's chart, a search everybody is making). Encore would use trends the way it uses taste: as evidence with a receipt, never as a guess.

## Sources, and what we know about each

Checked from what each provider publishes as of Oct 2026. Each line says how sure we are; nothing here has been probed yet.

| Source                                                                        | What it would give                                                                          | Access                                                                                                                                                                                                          | How sure                                                                  |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Qloo trends**                                                               | Rising entities (artists, places, dishes) for an area, in the same shape as today's answers | Already in our key: plan 02 probed a trends query for Williamsburg, East Austin and Logan Square                                                                                                                | High: it is the cheapest first slice and keeps receipts working unchanged |
| **Google Trends**                                                             | Searches rising in a country or region                                                      | An official Google Trends API exists in limited access; it needs an application                                                                                                                                 | Medium: check eligibility and terms                                       |
| **TikTok**                                                                    | Trending sounds and hashtags by country                                                     | TikTok's Research API is for non-commercial academic work. The public Creative Center shows trends by country but offers no API for a product like ours                                                         | Low: needs a partnership or a licensed data vendor                        |
| **Meta (Instagram, Facebook)**                                                | Trending topics                                                                             | No public trends API for products; the Meta Content Library is for researchers                                                                                                                                  | Low                                                                       |
| **X**                                                                         | Trending topics by place                                                                    | Trends are available on paid API tiers                                                                                                                                                                          | Medium: a cost decision                                                   |
| **Music charts** (Apple Music, Spotify, and in Africa Boomplay and Audiomack) | The most played songs per country                                                           | Apple Music's API serves charts per storefront with a developer token. Spotify restricted its editorial playlists for new apps in late 2024. Boomplay and Audiomack publish charts but no public API we know of | Medium for Apple Music; low for the rest                                  |

## How it would fit

- A `trends` step beside the taste fingerprint: one call per source per area per week, cached like Qloo answers, each item stored with where it came from and when.
- Concepts may cite a trend the same way they cite a taste: a chip that opens the stored answer. A trend with no stored answer is never mentioned.
- Talent: an act whose song is climbing the country's chart is marked "Rising now".
- Ads: the caption may use a trending hashtag only if it is in a stored trends answer for the area.

## The first slice (possible before the submission)

Qloo trends only, because the key already covers them and the receipts work as they are: a "Rising near you" line on the taste card and as an extra signal for concepts. One probe, one cached call per area, no new provider.

## Risks

- Terms of use: most social networks forbid storing or reselling their data. Each source needs its terms read before any code.
- Cost: paid tiers (X) and data vendors (TikTok) cost more than the rest of a plan together. Worth it only once owners pay (see the roadmap's money section).
- Noise: a trend in a country is not a trend on one street. Encore says which level a trend is from (country, city) and never presents a national trend as local.

## Questions for the owner

1. Which matters most to your first users: TikTok sounds, the country's music chart, or what people search for?
2. Is a paid data source acceptable after launch, once there is revenue, or should trends stay free sources only?
3. Should the Qloo trends slice go in before the submission, or after?

## Deliverables (first slice)

- [ ] Qloo trends probed for one US and one Kenyan area, findings recorded here
- [ ] "Rising near you" on the taste card, each item with a receipt
- [ ] Concepts may cite a rising item; the grounding validator accepts trend receipts
