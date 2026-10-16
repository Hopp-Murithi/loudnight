# Loudnight Door

The app door staff use on the night: sign in once, pick the venue, point the camera at tickets. Built with Expo (SDK 57) and React Native for iOS and Android. Plan: [`docs/architecture/plans/15-installable-app.md`](../../docs/architecture/plans/15-installable-app.md).

## What it does

| Screen      | What happens                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Sign in     | The same account as the web app. The session is kept in the phone's secure keychain.                                                    |
| Your venues | Only venues where you are on the team (owner, manager or door staff).                                                                   |
| The door    | Tonight's live count against break-even, waiting arrivals, scan, walk-in with party size, find a guest by name. The screen stays awake. |
| Scan        | Full-screen camera. Each ticket QR is sent as read; a typed code works too.                                                             |

Every result comes from the server, never from the phone:

- **Green, "in"**: the ticket was valid for tonight and is now used up.
- **Amber, "already came in"**: the ticket was used before, with the time; it is not counted twice, even if two phones scan it at once.
- **Red, "not let in"**: another night's ticket, a cancelled night, or not a Loudnight ticket, with the reason.
- **"Saved on this phone"**: there was no connection. The arrival waits on the phone and is sent when the connection returns (every 30 seconds and whenever the app reopens). A walk-in carries a key, so one sent twice is counted once.

Each result has its own vibration and is read out by screen readers. Counts update live on every phone through Supabase Realtime; nothing polls.

## How it stays safe

- The app sends the signed-in person's token with every call. The web app's API accepts it exactly like a browser session: the same roles and the same row level security. Door staff never see money or guests' contact details.
- The phone stores only the session (in the secure keychain) and, while offline, the scanned text, a guest id or a walk-in count. Never names, emails or phone numbers.

## Run it

```bash
cd apps/door
npm install
cp .env.example .env      # set the Supabase URL and publishable key (the same ones the web app uses)
npx expo start            # scan the QR with Expo Go, or press a / i for an emulator
npm test                  # the offline queue's tests (Node's built-in test runner)
npm run typecheck
```

An Android APK to install straight onto a phone is built in Expo's cloud (no Android SDK needed on your machine):

```bash
npx eas-cli build -p android --profile preview   # prints a link to download the .apk when it finishes
```

The `preview` profile in `eas.json` points the app at the live site and the hosted Supabase project (public values only). Store builds use the `production` profile and need store credentials.

## Layout

```
app/            Screens (Expo Router): sign in, venues, the door, scan
src/lib         Supabase client, API calls, the offline queue and its storage, shared types
src/hooks       Session, the live door view, arrivals with the offline fallback
src/components  The count and the scan result card
```
