// Set in .env (see .env.example). The publishable key is meant to ship inside apps; row level security protects data.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "https://encore-seven-dusky.vercel.app").replace(/\/$/, "")
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ""
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""

// How often waiting arrivals retry while the app is open, and how long a scan result stays on screen.
export const SYNC_EVERY_MS = 30_000
export const RESULT_MS = 1_500
