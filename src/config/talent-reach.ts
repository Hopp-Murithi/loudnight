// A typical fee for one act at a small venue, per currency, in whole units. Not a quote: it scales how big an act
// a budget can reach. The owner sees the label as Loudnight's estimate and asks the act. Currencies not listed use 1.
export const TYPICAL_SMALL_VENUE_FEE: Record<string, number> = {
  USD: 500,
  CAD: 600,
  GBP: 400,
  EUR: 450,
  AUD: 700,
  KES: 50_000,
  NGN: 400_000,
  GHS: 5_000,
  ZAR: 7_500,
  UGX: 1_500_000,
  TZS: 1_000_000,
  INR: 30_000,
  JPY: 70_000,
  BRL: 2_500,
  MXN: 8_000,
}

// Monthly listeners an act can have and still be within a budget at the typical fee; a stretch up to the second.
export const REACH_LISTENERS = { within: 50_000, stretch: 250_000 } as const

export type Reach = "within" | "stretch" | "beyond"

export const REACH_LABELS: Record<Reach, string> = {
  within: "Likely within your budget",
  stretch: "A stretch for your budget",
  beyond: "Probably beyond this budget",
}
