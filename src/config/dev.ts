// Development-only pages (the component gallery) exist only outside production builds.
export function devToolsEnabled(nodeEnv: string | undefined = process.env.NODE_ENV): boolean {
  return nodeEnv !== "production"
}
