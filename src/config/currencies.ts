// The currency a venue counts its money in, guessed from its country and changeable in settings.
// Amounts are stored as hundredths of the currency (cents, pence, Kenyan cents), whatever the currency.

const BY_COUNTRY: Record<string, string> = {
  // East Africa
  KE: "KES",
  UG: "UGX",
  TZ: "TZS",
  RW: "RWF",
  ET: "ETB",
  // West, North and Southern Africa
  NG: "NGN",
  GH: "GHS",
  SN: "XOF",
  CI: "XOF",
  ZA: "ZAR",
  BW: "BWP",
  ZM: "ZMW",
  EG: "EGP",
  MA: "MAD",
  // Europe
  GB: "GBP",
  IE: "EUR",
  FR: "EUR",
  DE: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  BE: "EUR",
  PT: "EUR",
  AT: "EUR",
  FI: "EUR",
  GR: "EUR",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  CH: "CHF",
  PL: "PLN",
  CZ: "CZK",
  TR: "TRY",
  // Americas
  US: "USD",
  CA: "CAD",
  MX: "MXN",
  BR: "BRL",
  AR: "ARS",
  CO: "COP",
  CL: "CLP",
  PE: "PEN",
  JM: "JMD",
  // Asia, the Gulf and Oceania
  JP: "JPY",
  KR: "KRW",
  CN: "CNY",
  IN: "INR",
  SG: "SGD",
  HK: "HKD",
  TH: "THB",
  ID: "IDR",
  PH: "PHP",
  MY: "MYR",
  VN: "VND",
  AE: "AED",
  SA: "SAR",
  QA: "QAR",
  AU: "AUD",
  NZ: "NZD",
}

export const DEFAULT_CURRENCY = "USD"

// Every currency Encore knows, for the settings picker, in alphabetical order.
export const CURRENCIES: readonly string[] = [...new Set(Object.values(BY_COUNTRY))].sort()

export const currencyFor = (countryCode: string | null | undefined): string =>
  (countryCode && BY_COUNTRY[countryCode.toUpperCase()]) || DEFAULT_CURRENCY

export const isCurrency = (value: unknown): value is string => typeof value === "string" && CURRENCIES.includes(value)
