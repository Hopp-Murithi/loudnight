// The type scale. Pages and components use these, never their own sizes, so every screen reads as one product.
export const TYPE = {
  display: "font-display text-6xl leading-[0.9] font-extrabold tracking-tight text-balance sm:text-7xl lg:text-8xl",
  h1: "font-display text-4xl leading-none font-bold tracking-tight text-balance sm:text-5xl",
  h2: "text-xl font-semibold tracking-tight text-balance",
  h3: "text-base font-semibold",
  lead: "max-w-2xl text-base text-muted-foreground sm:text-lg",
  body: "text-sm sm:text-base",
  caption: "text-xs text-muted-foreground",
  number: "tabular-nums",
} as const

export type TypeRole = keyof typeof TYPE
