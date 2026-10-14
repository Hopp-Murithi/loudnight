# Roadmap

What comes after the core loop (decide, execute, promote, measure), and how Loudnight pays for itself. Nothing in the later sections is built. Each item says what it solves, what it builds on, what it needs from outside, the first slice, and the risk. Plan 20 holds the full list; this file is filled in as items are thought through.

## How Loudnight makes money

Written Oct 14. Every cost below is either measured from Loudnight's own runs on the hosted project or a published list price, and says which. Revenue figures are worked examples, not forecasts: there are no paying customers yet.

### What one plan costs us

Measured from the seven finished plans on the hosted project (Oct 13 and 14): a plan takes about 71 seconds and makes 24 to 36 Qloo calls, 1 or 2 Google Places calls, 1 Ticketmaster call and three model calls (themes, concepts, scoring inputs). The concepts call is the big one, about 40 seconds of Claude Sonnet 5.5 using tools.

| Part                                               | Price basis                                                                                                    | Per plan                                                                                                                            |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Claude Sonnet 5.5 (themes, concepts)               | $2 per million tokens in, $10 out, $0.20 cached in                                                             | about $0.25, **estimated**: token counts are not logged yet (first step below)                                                      |
| Claude Haiku 5.5 (weekly twists, booking messages) | $0.10 in, $0.50 out                                                                                            | under $0.01                                                                                                                         |
| Qloo Insights                                      | free on the hackathon key; commercial price is by contract                                                     | **unknown**; answers are cached for seven days and shared across venues in one area, so a second venue nearby costs far fewer calls |
| Google Places (search, nearby, details)            | Google list price for Text Search and Nearby Search Pro, about $32 per thousand, with a monthly free allowance | about $0.03 to $0.07                                                                                                                |
| Ticketmaster Discovery                             | free with a key, rate limited                                                                                  | $0                                                                                                                                  |

So, before Qloo, **a plan costs about 30 US cents**. The rest of the month is cheaper still: a series, performers, ads (drawn in the owner's browser, no model call), the event page and the door cost cents or nothing.

Fixed costs: Supabase Pro (from $25 a month), Vercel Pro (from $20 a month per seat), a domain and email sending. Roughly $60 a month until there are hundreds of venues.

### What we charge, and why it is worth it to the owner

One subscription per venue, priced in the venue's own currency (plan 29 made money local), with a free way in.

| Plan  | What it includes                                                             | US           | Kenya              | UK           |
| ----- | ---------------------------------------------------------------------------- | ------------ | ------------------ | ------------ |
| Try   | One plan, the demo, the ad studio with a small Loudnight mark                | free         | free               | free         |
| Venue | A fresh plan every month, series, performers, ads, event page, door, results | $49 a month  | KES 2,500 a month  | £39 a month  |
| Group | Up to five venues, team roles, one bill                                      | $199 a month | KES 10,000 a month | £159 a month |

Later, once tickets are sold through the event page (plan 12): a booking fee paid by the guest, 3% capped at $1 or the local equivalent. The owner pays nothing extra for a full room.

**The owner's return, worked through** with the numbers Loudnight already asks for at sign-up (guests to break even, spend per guest):

- A Nairobi bar: 40 extra guests on a quiet Thursday at KES 1,500 each is KES 60,000 more on the night. Four Thursdays: KES 240,000 against a KES 2,500 subscription.
- A Brooklyn bar: 35 extra guests at $25 is $875 a night, $3,500 over the series, against $49.
- Even one night at half that turnout pays for the year in either city.

Loudnight never claims this on an owner's behalf: the Results page (plan 13) shows guests counted at the door and the owner's own spend figure, and the POS item above replaces the estimate with the till.

**Margin:** at $49 a month and one plan a month, the parts we can price today come to well under $1 a venue. Qloo's contract price is the number that decides the real margin, which is why answers are cached and shared by area.

### How each part is used and tracked

| Part                  | Who uses it         | What we count                                                                 | What it proves                   |
| --------------------- | ------------------- | ----------------------------------------------------------------------------- | -------------------------------- |
| Plan                  | Owner, once a month | plans started and finished, seconds per step, cost per plan                   | Loudnight can be trusted to plan |
| Series and performers | Owner, manager      | nights chosen, acts booked, messages sent                                     | ideas turn into nights           |
| Ads                   | Owner, manager      | images and videos saved, shares, QR scans (once the event page counts visits) | nights get promoted              |
| Event page and RSVP   | Guests              | page views, RSVPs                                                             | promotion reaches people         |
| Door                  | Door staff          | check-ins per night                                                           | people came                      |
| Results               | Owner               | guests against break-even, extra takings                                      | Loudnight paid for itself        |

All of these already exist as rows (runs, steps, series, bookings, assets, RSVPs, check-ins) except visits and shares, which plan 12 adds. A monthly view across venues for us (administrators, plan 08) turns them into the funnel above.

### Steps, in order

1. **Log the cost of every plan.** Store the model's token counts and each upstream call on `run_steps`, so cost per plan is measured, not estimated. A few lines in `lib/ai/client.ts` and the step recorder.
2. **Ask Qloo for commercial terms** with the measured call counts per plan and the caching rate.
3. **Free plan limits in the database** (the per-person run cap already exists, `EA429`), then Stripe for card markets and M-Pesa through a payment partner for Kenya.
4. **Results that show money** (plan 13, then the POS item above), because that is what renews a subscription.
5. **Booking fee** once paid tickets exist (plan 12).

### The risks

- Qloo's price is unknown and could be most of the cost. Mitigation: area-level caching (already built), and fewer calls per plan once measured.
- Owners may not trust a number they did not see happen. Mitigation: everything is shown with its receipt, and results come from the door and the till, not from Loudnight.
- Prices that suit Brooklyn do not suit Nyeri. Mitigation: local currency and local price points from day one, set per country, not converted.

## Paid tickets, the owner's wallet and payouts

**The problem.** Today a guest saves a free place and gets a ticket with a QR. Many nights should sell tickets. Owners want to see the money as it comes in and draw it out, and Loudnight's revenue should come from the same flow.

**What it builds on (all built).**

- The event page and its RSVP form, the ticket page with its own QR, and the door that checks a ticket once (`checkins.rsvp_id` is unique; a second scan says when the guest first came in).
- Takings per night (`night_spend`), the live Results page, the audit log.

**How it works.**

- A night can be free or ticketed: price, number of tickets, sales open and close. Ticket types later (early bird, table for four).
- Checkout on the event page through a payments partner per region: Stripe for card markets, M-Pesa (through a partner such as Flutterwave, Pesapal or Paystack) for Kenya and East Africa, Paystack or Flutterwave for West Africa. Loudnight never stores card details.
- A paid ticket is the same ticket as today, with `paid_at`, the amount, and the provider's reference. The door screen and the staff check-in work unchanged. A refunded ticket is void at the door.
- **No reuse**: a ticket's code is checked once (already enforced by the database); a refunded or cancelled ticket is refused; the door shows who used it and when. Transfers (sending a ticket to a friend) issue a new code and void the old one.
- **The owner's wallet**: every sale lands in the venue's balance in its own currency, less the payment provider's fee and Loudnight's booking fee. The wallet shows sales by night, pending and available balance, refunds, and payouts. Payouts go to the owner's bank or M-Pesa on a schedule or on request, through the provider's payout API (Stripe Connect, Paystack or Flutterwave subaccounts), so the money never sits in Loudnight's own account.
- **Loudnight's revenue**: the booking fee (3%, capped, paid by the guest), on top of the monthly plan. Both show in the administrator console (plan 08).
- **Tracking**: every sale, refund, payout and scan is a row, audited, owners and managers only (money), with the door seeing names and party sizes only, as today.

**With the point of sale.** A connected till (section above) adds the bar's own takings to the night, next to ticket sales, so Results shows tickets plus spend at the bar against the same weeks before the series. Tickets sold at the door on the till can be issued as Loudnight tickets too, so one door list holds everyone.

**What it needs from outside.** A payments partner account per region with marketplace payouts (Stripe Connect; Paystack or Flutterwave subaccounts), each venue's identity checks done by the provider, and consumer protection and refund terms per country.

**The first slice.** Ticketed nights in the US through Stripe Checkout and Stripe Connect Express payouts: price and quantity on a night, checkout, the paid ticket, the wallet page, one payout. Then M-Pesa in Kenya.

**The risk.** Money regulation differs by country; a partner that holds the funds and pays out keeps Loudnight out of money transmission. Chargebacks: the wallet keeps a reserve set by the provider.

## The door app

A React Native app (Expo, iOS and Android) for door staff: sign in once, pick tonight, scan tickets with the camera. A valid ticket turns the screen green with the guest's name and is used up on the spot; a used, cancelled or wrong-night ticket turns it red and says why. Counts update live on every phone, and scans made without a connection sync exactly once. It reuses the web app's rules: tickets are single use in the database, door staff never see money or contacts. The one server change is accepting the app's session as a bearer token. Full plan: [plan 15](architecture/plans/15-installable-app.md).

## Point-of-sale integration

**The problem.** Loudnight counts who came (check-ins at the door) and asks the owner for an average spend per guest. The till knows the truth: what the room actually took on an event night against a normal night. Until Loudnight reads the till, "this night earned you $X more" is an estimate.

**What it builds on.**

- `checkins.spend_cents` and the door dashboard (plan 13) already hold a per-night spend figure. A POS feed replaces the typed-in number with the real one.
- `venue_settings.average_spend_cents` becomes a measured baseline: the same weekday before the series started.
- The learning loop (plan 14) decides keep, tweak or swap from turnout. With takings it can decide from money.
- The readiness checklist already has "Float and card reader ready". With a POS connected, that line checks itself.

**What it needs from outside.**

- Partner access to each POS. Square has a public API with OAuth and an Orders and Payments API. Toast requires joining its partner programme before any venue can connect. Clover and Lightspeed have public APIs with OAuth.
- One OAuth connection per venue, stored encrypted, owners only. A new table `pos_connections` (venue, provider, token reference, status) following the new-table checklist in `CLAUDE.md`.
- A daily and an on-demand sync that reads totals for a time window. Loudnight needs sums per hour, not line items or card data, so it never holds payment details.

**Order of POS systems.** Square first (open API, the most common till in independent US bars and cafes, no partner gate), then Clover and Lightspeed, then Toast once the partner application is approved. Each is one thin client under `lib/pos/<provider>` behind a shared interface: `takingsBetween(start, end)`.

**The first slice.** Connect Square for one venue. After each event night, show on the Results page: takings during the night's hours, the same hours on the four weeks before the series, and the difference. Owners and managers only, like all money.

**The risk.** Takings on a night are not only the event (weather, a match on TV). Loudnight shows the comparison and the weeks it used, and never claims the whole difference. The second risk is partner approval time for Toast, which is why it is last.

## Posting straight to social networks

**The problem.** The ad studio (plan 11) makes the image, the video and the caption, and the phone's share sheet sends them to any app. That is one tap per network. Scheduling a post, or posting to a Page from a laptop, needs each network's own API.

**What it builds on.** The saved design per night (`event_nights.assets.ad`), the captions per channel, and the booked act.

**What it needs from outside.** Meta app review for Instagram and Facebook Page publishing, a TikTok developer app with the content posting scope, a Google Business Profile API allowlisting, and OAuth per venue for each.

**The first slice.** Facebook Page and Instagram Business publishing for the first night of a series, with a preview and an explicit confirm. Nothing posts on its own.

**The risk.** App review takes weeks and can be refused. The share sheet already covers the need on a phone, so this is a convenience, not a gap.

## What is trending near the venue

**The problem.** Qloo tells Loudnight what an area has loved for years. Owners also want what people are talking about this month: a sound going round on TikTok, a song climbing the country's chart, a search everybody is making.

**What it builds on.** The taste fingerprint and its cache, the receipts on every number, the concept grounding validator, the talent cards.

**What it needs from outside.** Sources differ a lot: Qloo's own trends are already in our key; Google Trends has an official API in limited access; TikTok and Meta offer no trends API for products like ours (research access only), so they would need a partnership or a licensed vendor; X sells trends on paid tiers; Apple Music serves country charts. Every source's terms must be read before any code, because most forbid storing or reselling their data.

**The order (owner's decision, Oct 14).** Qloo only for the hackathon. After launch: search trends (Google Trends access), then the country's music chart (Apple Music charts, a paid chart vendor elsewhere), then social trends through a licensed vendor. Paid sources are acceptable once there is revenue.

**The risk.** Terms and cost, and mistaking a national trend for a local one. Loudnight always says which level a trend is from. Full research plan: [plan 31](architecture/plans/31-local-trends.md).
