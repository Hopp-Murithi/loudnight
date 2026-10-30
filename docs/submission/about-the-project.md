## Inspiration

Walk past almost any bar, restaurant or club on a Tuesday and it is half empty. Rent, staff and stock cost the same as on a Saturday. Owners know they should run something, but they guess what to run, copy the place down the street, or ask a chatbot that gives every postcode the same answer: trivia, karaoke, open mic.

Qloo already knows what the people around any address love. We wanted to put that knowledge in the hands of the person who needs it most: the owner with an empty room on a weeknight.

## What it does

Loudnight takes a venue from an empty night to a full room, in one app.

1. **Set up in about two minutes.** Any venue, in any country and currency: a bar, cafe, restaurant, club, hotel or event space. The owner enters the address, the quiet nights, what the room can host, the performer budget and how many guests they need to break even.
2. **Plan the night with Qloo.** In about three minutes, Loudnight reads what people nearby love across eleven areas of taste, checks what nearby venues and events already offer, and suggests three weekly nights that nobody nearby runs. Each night gets a score out of 100, and **every number can be tapped to open the exact Qloo answer it came from.** A plain chatbot answer sits beside it so the difference is easy to see.
3. **Turn it into a series.** The chosen night becomes four dated weeks, each with its own twist.
4. **Book performers.** Local acts whose fans match the night, local first, each labelled for the budget, with photos, Instagram and Spotify links, listener counts and a booking message ready to send. Stars the venue could never afford are left out.
5. **Promote.** Posters, stories, banners and short videos with the booked acts' photos and a ticket QR code, plus captions for each network and Spanish versions.
6. **Take bookings.** A public event page where guests reserve a place without an account and get a ticket for their whole party.
7. **Run the door.** Staff scan tickets, find a name or count walk-ins on the website or in the **Loudnight Door app** for Android. A ticket works once, only on the night, for the number of people it was booked for. Every phone at the door shows the same live count against break-even.
8. **See what worked.** Results show who came, each night against break-even, and each night's takings.

Owners invite managers and door staff by email. One person can hold different roles at different venues and switch between them in the app. An administrator console handles venues, people, suspensions, a full change history and a read-only view of any user's screens for support.

## How we built it

- **Qloo is the engine.** About 35 Qloo calls go into each plan, across five of the six planning steps: the neighbourhood's tastes, who the crowd is (demographics), what is already on within 2 km, whether two tastes overlap locally (for example alt-country fans and a local cider), and which artists fit the night.
- **An agent with a fixed path.** Claude plans in six steps that stream live on screen: scout, read the neighbourhood, find the gap, invent the nights, score, plan. Claude chooses its tools inside each step, never the order of the steps, so every run is fast and predictable.
- **No number without a receipt.** Every Qloo answer is saved with the question that produced it. Every number on screen points to that saved answer, and the database itself refuses any number that is not in it. The model proposes the four score inputs, and the database calculates the total: 40 x audience fit + 20 x novelty + 20 x venue fit + 20 x cost fit.
- **More sources where Qloo is thin.** Google Places and Ticketmaster for what is nearby, Wikidata and MusicBrainz for local performers, and Deezer and iTunes for their photos.
- **Built to be trusted.** Next.js 16 and React 19 on Vercel, Supabase Postgres with row level security so each venue's data stays private, live updates for the door, and an Expo React Native door app on the same API. More than 500 automated tests run on every change, plus database tests for every role.

## Challenges I ran into

- **Popularity in Qloo is global, not local.** A star in one country can look like a small, bookable act. We capped popularity and added home country checks so venues see their own country's acts first.
- **Local performers are thin outside the biggest markets.** Near Nairobi, Qloo had few local artists and no comedians, so we added open data and said so on each card.
- **Stopping the model from inventing numbers.** Prompts were not enough. I moved the rule into the database so a made-up number cannot be saved at all.
- **Keeping a long agent run fast.** Each step is its own server call, and answers are cached and reused for a week, so no request comes close to a time limit.
- **A door that cannot be faked.** Guests could once check themselves in. Now only the venue's team can, only on the night, and each ticket works once.

## Accomplishments that I'm proud of

- The whole journey works end to end on a phone: address, plan, series, performers, ads, event page, ticket, door app, live count and results.
- In our Austin test, the top suggestion, Cider & Alt-Country Wednesdays, scored 100. Two local bands were booked, a guest reserved on one phone, the ticket was scanned on a second, and the door count on a third went from 0 to 2 of 35 without refreshing.
- Every Qloo number on screen opens its receipt.
- It works in any country, currency and time zone.

## What we learned

- Taste data is most valuable when it helps a business decide what to do, not just a person decide what to watch.
- Different neighbourhoods really do love different things. East Austin leaned alt-country and blues, and Williamsburg leaned indie and experimental.
- Trust has to be built into the data, not just the prompt.

## What's next for Loudnight

- Launch with venues in Austin, New York, Chicago, London and Berlin.
- The door app in the App Store and Google Play.
- Paid tickets and payouts to venues, with card payments and mobile money such as M-Pesa.
- A learning loop where each night's turnout decides the next one: keep it, change it or replace it.
- Pricing: free to try, $49 a month for a venue, $199 a month for groups of up to five venues.
