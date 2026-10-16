import type { NextConfig } from "next"

const isDev = process.env.NODE_ENV !== "production"
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseSocket = supabaseUrl.replace(/^http/, "ws")

// Next hydrates with inline scripts, so script-src allows them; everything else is locked to known origins.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.googleusercontent.com https://places.googleapis.com https://images.qloo.com https://*.dzcdn.net https://*.mzstatic.com",
  "font-src 'self'",
  `connect-src 'self' ${supabaseUrl} ${supabaseSocket}`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The door scanner needs the camera on our own pages only.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Performer photos come from Qloo's image host. No other outside image is fetched and resized.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.qloo.com", pathname: "/i/**" },
      { protocol: "https", hostname: "**.dzcdn.net", pathname: "/images/**" },
      { protocol: "https", hostname: "**.mzstatic.com", pathname: "/image/**" },
    ],
  },
  headers: async () => [{ source: "/:path*", headers: securityHeaders }],
}

export default nextConfig
