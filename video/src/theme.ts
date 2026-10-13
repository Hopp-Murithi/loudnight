import { loadFont as loadDisplay } from "@remotion/google-fonts/BigShoulders";
import { loadFont as loadSans } from "@remotion/google-fonts/Geist";
import { Easing } from "remotion";

// The same brand as the app: late-night ink, spotlight amber, copper.
export const COLORS = {
  ink: "#120d0b",
  inkSoft: "#1c1411",
  white: "#ffffff",
  muted: "rgba(255,255,255,0.72)",
  faint: "rgba(255,255,255,0.14)",
  spotlight: "#f2b860",
  copper: "#a4361c",
  success: "#5ccf9b",
} as const

export const DISPLAY = loadDisplay("normal", { weights: ["700", "800"], subsets: ["latin"] }).fontFamily
export const SANS = loadSans("normal", { weights: ["400", "500", "600"], subsets: ["latin"] }).fontFamily

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1)

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const
