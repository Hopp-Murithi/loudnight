import type { Metadata, Viewport } from "next"
import { Big_Shoulders, Geist, Geist_Mono, Noto_Color_Emoji } from "next/font/google"
import { AppProviders } from "@/components/providers/app-providers"
import { SITE } from "@/config/site"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
// The marquee face: display headlines and page titles only. Everything else stays in Geist.
const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
  adjustFontFallback: false,
  fallback: ["Arial Narrow", "sans-serif"],
})

// Country flags only. Windows has no flag emoji of its own; the browser fetches just the slice that holds the flags.
const flagFont = Noto_Color_Emoji({ variable: "--font-flag", subsets: ["emoji"], weight: "400", preload: false })

export const metadata: Metadata = {
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#120d0b" },
  ],
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${bigShoulders.variable} ${flagFont.variable}`}
    >
      <body className="min-h-dvh">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
